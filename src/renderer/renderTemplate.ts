import type { SignRenderConfig } from '../types';
import type { Composition, GraphicElement } from '../composition';
import { renderCompositionToSvg } from '../composition';
import { getFrameGeometry, insetPolygon } from './geometry';

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const cmykToRgb = ({ c, m, y, k }: { c: number; m: number; y: number; k: number }) => {
  const C = clamp(c, 0, 100) / 100;
  const M = clamp(m, 0, 100) / 100;
  const Y = clamp(y, 0, 100) / 100;
  const K = clamp(k, 0, 100) / 100;
  return `rgb(${Math.round(255 * (1 - C) * (1 - K))},${Math.round(255 * (1 - M) * (1 - K))},${Math.round(255 * (1 - Y) * (1 - K))})`;
};

const scaleFor = (w: number, h: number) => Math.min(w, h) / 100;

function wrap(text: string, maxChars: number) {
  return text.split(/\r?\n/).flatMap((line) => {
    const words = line.trim().toUpperCase().split(/\s+/).filter(Boolean);
    const output: string[] = [];
    let current = '';
    words.forEach((word) => {
      const next = current ? `${current} ${word}` : word;
      if (next.length > maxChars && current) {
        output.push(current);
        current = word;
      } else current = next;
    });
    if (current) output.push(current);
    return output;
  });
}

function pointsString(points: Array<{ x: number; y: number }>) {
  return points.map((point) => `${point.x},${point.y}`).join(' ');
}

function iconElements(svg: string, x: number, y: number, scale: number, prohibition: boolean): GraphicElement[] {
  if (!svg) return [];
  const elements: GraphicElement[] = [{ type: 'icon', x, y, scale, color: '#000', svg }];
  if (!prohibition) return elements;

  const radius = 11.5 * scale;
  const prohibitionStroke = 2.2 * scale;
  elements.push({ type: 'circle', cx: x, cy: y, r: radius, fill: 'none', stroke: 'rgb(220,0,0)', strokeWidth: prohibitionStroke });
  elements.push({
    type: 'group',
    transform: `rotate(45 ${x} ${y})`,
    children: [{ type: 'rect', x: x - prohibitionStroke / 2, y: y - radius, width: prohibitionStroke, height: radius * 2, fill: 'rgb(220,0,0)' }],
  });
  return elements;
}

export function renderTemplate(config: SignRenderConfig): string {
  const geometry = getFrameGeometry(config.frameType, config.widthMm, config.heightMm);
  const { width: w, height: h, centerX: cx, centerY: cy } = geometry;
  const { frameType, appearance } = config;
  const frame = cmykToRgb(appearance.frameColor);
  const bg = cmykToRgb(appearance.backgroundColor);
  const s = scaleFor(w, h);
  const margin = 5 * s;
  const stroke = 2 * s;
  const pad = 7 * s;
  const elements: GraphicElement[] = [];

  if (frameType === 'simple' || frameType === 'header') {
    elements.push({ type: 'rect', x: 0, y: 0, width: w, height: h, fill: bg });

    // Technical outer border: 0.5 mm, C0 M0 Y0 K30.
    // It sits at the very edge and is intentionally independent from the
    // main black/color frame.
    elements.push({
      type: 'rect',
      x: 0.25,
      y: 0.25,
      width: w - 0.5,
      height: h - 0.5,
      fill: 'none',
      stroke: 'rgb(179,179,179)',
      strokeWidth: 0.5,
    });

    const inner = { x: margin, y: margin, width: w - margin * 2, height: h - margin * 2 };
    elements.push({ type: 'rect', ...inner, fill: 'none', stroke: frame, strokeWidth: stroke, rx: 4 * s, ry: 4 * s });

    if (frameType === 'header') {
      const headerH = 28 * s;
      elements.push({ type: 'rect', x: margin, y: margin, width: inner.width, height: headerH, fill: frame, rx: 4 * s, ry: 4 * s });
      elements.push({ type: 'rect', x: margin, y: margin + headerH - 4 * s, width: inner.width, height: 4 * s, fill: frame });
      elements.push({ type: 'text', x: cx, y: margin + headerH / 2, text: (config.heading || 'AVISO').toUpperCase(), fontSize: 16 * s, fontWeight: 800, fill: '#fff', fontFamily: 'Barlow Semi Condensed, sans-serif', anchor: 'middle', dominantBaseline: 'middle' });
    }
  } else if (frameType === 'circular') {
    const outerRadius = geometry.radius!;
    const borderRadius = outerRadius - margin;
    elements.push({ type: 'circle', cx, cy, r: outerRadius, fill: bg });
    elements.push({ type: 'circle', cx, cy, r: borderRadius, fill: 'none', stroke: frame, strokeWidth: stroke });
  } else if (frameType === 'diamond' || frameType === 'triangle') {
    const outerPoints = geometry.points!;
    const borderPoints = insetPolygon(outerPoints, margin);
    elements.push({ type: 'polygon', points: pointsString(outerPoints), fill: bg });
    elements.push({ type: 'polygon', points: pointsString(borderPoints), fill: 'none', stroke: frame, strokeWidth: stroke });
  }

  const contentTop = frameType === 'header' ? margin + 32 * s : margin + pad;
  const contentBottom = h - margin - pad;
  const baseTextSize = clamp(10 * s, 8, 42);
  const hasIcon = config.showIcon && Boolean(config.iconSvg);
  const isNonRectangular = frameType === 'circular' || frameType === 'diamond' || frameType === 'triangle';
  const usableWidth = isNonRectangular ? Math.min(w, h) - 2 * (margin + pad) : w - 2 * (margin + stroke + pad);
  const usableHeight = Math.max(1, contentBottom - contentTop);

  const preliminaryMaxChars = Math.max(4, Math.floor(usableWidth / Math.max(1, 5.5 * s)));
  const preliminaryLines = wrap(config.message || '', preliminaryMaxChars);
  const textLineHeight = baseTextSize * 1.12;
  const textGap = 10 * s;

  let textX = cx;
  let textY = (contentTop + contentBottom) / 2;
  let iconX = cx;
  let iconY = contentTop + 24 * s;
  let finalLines = preliminaryLines;
  let finalFontSize = baseTextSize;
  let finalLineHeight = textLineHeight;
  let finalIconScale = 3.8 * s;

  if (hasIcon && appearance.pictogramPosition === 'top') {
    // The complete visual content is one block. Its bounding box is fitted
    // against BOTH safe width and safe height before it is centered.
    const symbolMaxScaleByWidth = appearance.prohibition
      ? usableWidth / (2 * 11.5 + 2.2)
      : usableWidth / 24;
    const desiredSymbolScale = 3.8 * s;
    const symbolBaseScale = Math.min(desiredSymbolScale, symbolMaxScaleByWidth);
    const symbolDiameter = appearance.prohibition
      ? (2 * 11.5 + 2.2) * symbolBaseScale
      : 24 * symbolBaseScale;

    // Use the available width to wrap the text before calculating its height.
    const maxTextChars = Math.max(4, Math.floor(usableWidth / Math.max(1, 5.5 * s)));
    finalLines = wrap(config.message || '', maxTextChars);

    // The symbol and text are scaled together. The fit is deliberately
    // conservative so the final text still has a healthy visual margin.
    const estimatedTextWidth = Math.max(1, ...finalLines.map((line) => line.length * baseTextSize * 0.52));
    const baseBlockWidth = Math.max(symbolDiameter, estimatedTextWidth);
    const baseBlockHeight = symbolDiameter + textGap + finalLines.length * textLineHeight;
    const blockScale = Math.min(
      1,
      usableWidth / Math.max(1, baseBlockWidth),
      usableHeight / Math.max(1, baseBlockHeight),
    );

    finalIconScale = Math.max(0.25, symbolBaseScale * blockScale);
    finalFontSize = Math.max(8, baseTextSize * blockScale);
    finalLineHeight = Math.max(finalFontSize * 1.06, textLineHeight * blockScale);

    // Re-wrap after the global scale is known. More lines reduce the global
    // scale on the next calculation, never allowing the block to overflow.
    const effectiveCharWidth = Math.max(1, 5.5 * s * blockScale);
    const fittedMaxChars = Math.max(4, Math.floor(usableWidth / effectiveCharWidth));
    finalLines = wrap(config.message || '', fittedMaxChars);

    const finalSymbolDiameter = appearance.prohibition
      ? (2 * 11.5 + 2.2) * finalIconScale
      : 24 * finalIconScale;
    const finalTextHeight = finalLines.length * finalLineHeight;
    const finalBlockHeight = finalSymbolDiameter + textGap * blockScale + finalTextHeight;
    const finalBlockTop = contentTop + Math.max(0, (usableHeight - finalBlockHeight) / 2);

    iconX = cx;
    iconY = finalBlockTop + finalSymbolDiameter / 2;
    textX = cx;
    textY = finalBlockTop + finalSymbolDiameter + textGap * blockScale + finalTextHeight / 2;
  } else if (hasIcon && appearance.pictogramPosition === 'left') {
    iconX = margin + pad + 19 * s;
    textX = iconX + 28 * s;
    textY = (contentTop + contentBottom) / 2;
  } else if (hasIcon && appearance.pictogramPosition === 'right') {
    iconX = w - margin - pad - 19 * s;
    textX = iconX - 28 * s;
    textY = (contentTop + contentBottom) / 2;
  }

  if (hasIcon) elements.push(...iconElements(config.iconSvg, iconX, iconY, finalIconScale, appearance.prohibition));

  if (appearance.pictogramPosition !== 'top') {
    const sideReduction = appearance.pictogramPosition === 'left' || appearance.pictogramPosition === 'right' ? 36 * s : 0;
    const maxTextWidth = Math.max(35 * s, usableWidth - sideReduction);
    finalLines = wrap(config.message || '', Math.max(4, Math.floor(maxTextWidth / Math.max(1, 5.5 * s))));
  }

  const textAnchor = appearance.pictogramPosition === 'left' ? 'start' : appearance.pictogramPosition === 'right' ? 'end' : 'middle';

  finalLines.forEach((line, index) => elements.push({
    type: 'text',
    x: textX,
    y: textY + (index - (finalLines.length - 1) / 2) * finalLineHeight,
    text: line,
    fontSize: finalFontSize,
    fontWeight: 800,
    fill: '#000',
    fontFamily: 'Barlow Semi Condensed, sans-serif',
    anchor: textAnchor,
    dominantBaseline: 'middle',
  }));

  const composition: Composition = { widthMm: w, heightMm: h, elements };
  return renderCompositionToSvg(composition);
}
