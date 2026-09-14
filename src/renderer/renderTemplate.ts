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

/**
 * Pictograma + anel/barra opcionais.
 * ringRadiusMm e iconScale são independentes: o ícone deve caber dentro do anel.
 */
function iconElements(
  svg: string,
  x: number,
  y: number,
  iconScale: number,
  ringRadiusMm: number,
  circle: boolean,
  prohibition: boolean,
): GraphicElement[] {
  if (!svg) return [];
  const elements: GraphicElement[] = [{ type: 'icon', x, y, scale: iconScale, color: '#000', svg }];

  if (!circle && !prohibition) return elements;

  const ringStroke = Math.max(1.8, ringRadiusMm * 0.16);

  if (circle || prohibition) {
    elements.push({
      type: 'circle',
      cx: x,
      cy: y,
      r: ringRadiusMm,
      fill: 'none',
      stroke: 'rgb(220,0,0)',
      strokeWidth: ringStroke,
    });
  }

  if (prohibition) {
    elements.push({
      type: 'group',
      transform: `rotate(45 ${x} ${y})`,
      children: [{
        type: 'rect',
        x: x - ringStroke / 2,
        y: y - ringRadiusMm,
        width: ringStroke,
        height: ringRadiusMm * 2,
        fill: 'rgb(220,0,0)',
      }],
    });
  }

  return elements;
}

function isLetterSlug(slug?: string): boolean {
  if (!slug) return false;
  return /mdi:alpha-[a-z](?:-|$)/i.test(slug) || /letter-/i.test(slug);
}

/** Estimativa de largura de um glifo em Barlow Semi Condensed (bold). */
const CHAR_WIDTH_FACTOR = 0.56;

export function renderTemplate(config: SignRenderConfig): string {
  const geometry = getFrameGeometry(config.frameType, config.widthMm, config.heightMm);
  const { width: w, height: h, centerX: cx } = geometry;
  const { frameType, appearance } = config;
  const frame = cmykToRgb(appearance.frameColor);
  const bg = cmykToRgb(appearance.backgroundColor);
  const s = scaleFor(w, h);

  const margin = 4 * s;
  const stroke = 2 * s;
  const pad = 2.5 * s;
  const elements: GraphicElement[] = [];

  if (frameType === 'simple' || frameType === 'header') {
    elements.push({ type: 'rect', x: 0, y: 0, width: w, height: h, fill: bg });
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
      elements.push({
        type: 'text',
        x: cx,
        y: margin + headerH / 2,
        text: (config.heading || 'AVISO').toUpperCase(),
        fontSize: 16 * s,
        fontWeight: 800,
        fill: '#fff',
        fontFamily: 'Barlow Semi Condensed, sans-serif',
        anchor: 'middle',
        dominantBaseline: 'middle',
      });
    }
  } else if (frameType === 'circular') {
    const outerRadius = geometry.radius!;
    const borderRadius = outerRadius - margin;
    elements.push({ type: 'circle', cx, cy: geometry.centerY, r: outerRadius, fill: bg });
    elements.push({ type: 'circle', cx, cy: geometry.centerY, r: borderRadius, fill: 'none', stroke: frame, strokeWidth: stroke });
  } else if (frameType === 'diamond' || frameType === 'triangle') {
    const outerPoints = geometry.points!;
    const borderPoints = insetPolygon(outerPoints, margin);
    elements.push({ type: 'polygon', points: pointsString(outerPoints), fill: bg });
    elements.push({ type: 'polygon', points: pointsString(borderPoints), fill: 'none', stroke: frame, strokeWidth: stroke });
  }

  const contentTop = frameType === 'header' ? margin + 32 * s : margin + pad;
  const contentBottom = h - margin - pad;
  const hasIcon = config.showIcon && Boolean(config.iconSvg);
  const isNonRectangular = frameType === 'circular' || frameType === 'diamond' || frameType === 'triangle';
  const usableWidth = isNonRectangular
    ? Math.min(w, h) - 2 * (margin + pad)
    : w - 2 * (margin + stroke + pad);
  const usableHeight = Math.max(1, contentBottom - contentTop);

  const needsRing = appearance.circle || appearance.prohibition;
  const textGap = 6 * s;
  const position = appearance.pictogramPosition;

  // Bloco de referência do pictograma (topo).
  const targetBlockWidth = Math.min(usableWidth * 0.72, usableHeight * 0.55);
  const ringRadius = targetBlockWidth / 2;

  const innerDiameter = ringRadius * 2 * 0.84;
  const letterBoost = isLetterSlug(config.iconSlug) ? 1.3 : 1;
  const iconScale = ((innerDiameter * 0.78) / 24) * letterBoost;

  // Texto no topo: um pouco mais largo que o diâmetro externo do anel.
  // 0.26 * D e CHAR_WIDTH_FACTOR 0.56 → ~8 chars cobrem ≥ diâmetro.
  const textWidthTarget = targetBlockWidth * 1.08;
  let finalLines = wrap(config.message || '', Math.max(4, Math.floor(textWidthTarget / Math.max(1, 5.0 * s))));
  let finalFontSize = clamp(textWidthTarget * 0.26, 12, 56);
  let finalLineHeight = finalFontSize * 1.12;
  let textX = cx;
  let textY = (contentTop + contentBottom) / 2;
  let finalRingRadius = ringRadius;
  let finalIconScale = iconScale;

  if (hasIcon && position === 'top') {
    let blockScale = 1;
    for (let iteration = 0; iteration < 3; iteration += 1) {
      const blockW = Math.max(targetBlockWidth, textWidthTarget) * blockScale;
      const scaledFont = Math.max(12, finalFontSize * blockScale);
      const scaledLineH = scaledFont * 1.12;
      const textH = finalLines.length * scaledLineH;
      const pictW = targetBlockWidth * blockScale;
      const blockH = pictW + textGap * blockScale + textH;
      const next = Math.min(
        1,
        usableWidth / Math.max(1, blockW),
        usableHeight / Math.max(1, blockH),
      );
      blockScale = Math.min(blockScale, next);
    }

    finalRingRadius = ringRadius * blockScale;
    finalIconScale = iconScale * blockScale;
    finalFontSize = Math.max(12, finalFontSize * blockScale);
    finalLineHeight = finalFontSize * 1.12;

    // Largura alvo do texto = diâmetro externo do anel * 1.08
    const outerDiameter = finalRingRadius * 2;
    const textTarget = outerDiameter * 1.08;
    finalLines = wrap(
      config.message || '',
      Math.max(4, Math.floor(textTarget / Math.max(1, finalFontSize * CHAR_WIDTH_FACTOR))),
    );

    const finalPictW = outerDiameter;
    const finalTextH = finalLines.length * finalLineHeight;
    const finalBlockH = finalPictW + textGap * blockScale + finalTextH;
    const finalBlockTop = contentTop + Math.max(0, (usableHeight - finalBlockH) / 2);

    textX = cx;
    textY = finalBlockTop + finalPictW + textGap * blockScale + finalTextH / 2;
    const iconY = finalBlockTop + finalPictW / 2;

    elements.push(...iconElements(
      config.iconSvg,
      cx,
      iconY,
      finalIconScale,
      needsRing ? finalRingRadius : 0,
      appearance.circle,
      appearance.prohibition,
    ));
  } else if (hasIcon && (position === 'left' || position === 'right')) {
    // Lado: pictograma limitado pela altura útil e por uma fração da largura.
    const sideRingRadius = Math.min(
      usableHeight * 0.38,
      usableWidth * 0.28,
      ringRadius,
    );
    const sideInnerDiameter = sideRingRadius * 2 * 0.84;
    const sideIconScale = ((sideInnerDiameter * 0.78) / 24) * letterBoost;
    finalRingRadius = sideRingRadius;
    finalIconScale = sideIconScale;

    const gap = 10 * s;
    const pictBlock = sideRingRadius * 2;
    const textAreaWidth = Math.max(40 * s, usableWidth - pictBlock - gap);

    finalFontSize = clamp(Math.min(textAreaWidth * 0.14, usableHeight * 0.12), 10, 42);
    finalLineHeight = finalFontSize * 1.12;
    finalLines = wrap(
      config.message || '',
      Math.max(4, Math.floor(textAreaWidth / Math.max(1, finalFontSize * CHAR_WIDTH_FACTOR))),
    );

    const textBlockH = finalLines.length * finalLineHeight;
    const contentMidY = (contentTop + contentBottom) / 2;

    // Centraliza o par ícone+texto na altura útil.
    const pairH = Math.max(pictBlock, textBlockH);
    const pairTop = contentMidY - pairH / 2;
    const iconY = pairTop + pairH / 2;
    textY = pairTop + pairH / 2;

    if (position === 'left') {
      const iconX = margin + pad + sideRingRadius;
      textX = iconX + sideRingRadius + gap;
      elements.push(...iconElements(
        config.iconSvg,
        iconX,
        iconY,
        finalIconScale,
        needsRing ? sideRingRadius : 0,
        appearance.circle,
        appearance.prohibition,
      ));
    } else {
      const iconX = w - margin - pad - sideRingRadius;
      textX = iconX - sideRingRadius - gap;
      elements.push(...iconElements(
        config.iconSvg,
        iconX,
        iconY,
        finalIconScale,
        needsRing ? sideRingRadius : 0,
        appearance.circle,
        appearance.prohibition,
      ));
    }
  } else {
    // Só texto, sem pictograma.
    finalLines = wrap(config.message || '', Math.max(4, Math.floor(usableWidth / Math.max(1, 5.5 * s))));
    finalFontSize = clamp(12 * s, 12, 56);
    finalLineHeight = finalFontSize * 1.12;
    textX = cx;
    textY = (contentTop + contentBottom) / 2;
  }

  const textAnchor = position === 'left'
    ? 'start'
    : position === 'right'
      ? 'end'
      : 'middle';

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
