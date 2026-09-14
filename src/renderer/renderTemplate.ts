import type { SignRenderConfig } from '../types';
import type { Composition, GraphicElement } from '../composition';
import { renderCompositionToSvg } from '../composition';

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
      } else {
        current = next;
      }
    });
    if (current) output.push(current);
    return output;
  });
}

function iconElements(svg: string, x: number, y: number, scale: number, prohibition: boolean): GraphicElement[] {
  if (!svg) return [];
  const elements: GraphicElement[] = [{ type: 'icon', x, y, scale, color: '#000', svg }];
  if (!prohibition) return elements;

  const radius = 11.5 * scale;
  const stroke = 2.2 * scale;
  elements.push({ type: 'circle', cx: x, cy: y, r: radius, fill: 'none', stroke: 'rgb(220,0,0)', strokeWidth: stroke });
  elements.push({
    type: 'group',
    transform: `rotate(45 ${x} ${y})`,
    children: [{ type: 'rect', x: x - stroke / 2, y: y - radius, width: stroke, height: radius * 2, fill: 'rgb(220,0,0)' }],
  });
  return elements;
}

export function renderTemplate(config: SignRenderConfig): string {
  const { widthMm: w, heightMm: h, frameType, appearance } = config;
  const frame = cmykToRgb(appearance.frameColor);
  const bg = cmykToRgb(appearance.backgroundColor);
  const s = scaleFor(w, h);
  const margin = 5 * s;
  const stroke = 2 * s;
  const pad = 7 * s;
  const cx = w / 2;
  const cy = h / 2;
  const elements: GraphicElement[] = [{ type: 'rect', x: 0, y: 0, width: w, height: h, fill: bg }];
  const inner = { x: margin, y: margin, width: w - margin * 2, height: h - margin * 2 };

  if (frameType === 'simple') {
    elements.push({ type: 'rect', ...inner, fill: 'none', stroke: frame, strokeWidth: stroke, rx: 4 * s, ry: 4 * s });
  }
  if (frameType === 'header') {
    elements.push({ type: 'rect', ...inner, fill: 'none', stroke: frame, strokeWidth: stroke, rx: 4 * s, ry: 4 * s });
    const headerH = 28 * s;
    elements.push({ type: 'rect', x: margin, y: margin, width: inner.width, height: headerH, fill: frame, rx: 4 * s, ry: 4 * s });
    elements.push({ type: 'rect', x: margin, y: margin + headerH - 4 * s, width: inner.width, height: 4 * s, fill: frame });
    elements.push({ type: 'text', x: cx, y: margin + headerH / 2, text: (config.heading || 'AVISO').toUpperCase(), fontSize: 16 * s, fontWeight: 800, fill: '#fff', fontFamily: 'Barlow Semi Condensed, sans-serif', anchor: 'middle', dominantBaseline: 'middle' });
  }
  if (frameType === 'circular') {
    const r = Math.min(w, h) / 2 - margin;
    elements.push({ type: 'circle', cx, cy, r, fill: bg, stroke: frame, strokeWidth: stroke });
  }
  if (frameType === 'diamond') {
    const d = Math.min(w, h) / 2 - margin;
    elements.push({ type: 'polygon', points: `${cx},${cy - d} ${cx + d},${cy} ${cx},${cy + d} ${cx - d},${cy}`, fill: bg, stroke: frame, strokeWidth: stroke });
  }
  if (frameType === 'triangle') {
    const top = margin;
    const baseY = h - margin;
    elements.push({ type: 'polygon', points: `${cx},${top} ${w - margin},${baseY} ${margin},${baseY}`, fill: bg, stroke: frame, strokeWidth: stroke });
  }

  const contentTop = frameType === 'header' ? margin + 32 * s : margin + pad;
  const contentBottom = h - margin - pad;
  const textSize = clamp(10 * s, 8, 42);
  const lineH = textSize * 1.12;
  const hasIcon = config.showIcon && Boolean(config.iconSvg);
  const lines = wrap(config.message || '', Math.max(8, Math.floor((w - pad * 2) / (5.5 * s))));
  const blockH = lines.length * lineH;
  const textGap = 6 * s;
  const iconScale = 3.8 * s;
  let textX = cx;
  let textY = (contentTop + contentBottom) / 2;
  let iconX = cx;
  let iconY = contentTop + 24 * s;

  if (hasIcon && appearance.pictogramPosition === 'top') {
    const available = Math.max(24 * s, contentBottom - contentTop - blockH - textGap);
    iconY = contentTop + available / 2;
    textY = iconY + 20 * s + textGap + blockH / 2;
  } else if (hasIcon && appearance.pictogramPosition === 'left') {
    iconX = margin + pad + 19 * s;
    textX = iconX + 28 * s;
    textY = (contentTop + contentBottom) / 2;
  } else if (hasIcon && appearance.pictogramPosition === 'right') {
    iconX = w - margin - pad - 19 * s;
    textX = iconX - 28 * s;
    textY = (contentTop + contentBottom) / 2;
  }

  if (hasIcon) elements.push(...iconElements(config.iconSvg, iconX, iconY, iconScale, appearance.prohibition));
  const textAnchor = appearance.pictogramPosition === 'left' ? 'start' : appearance.pictogramPosition === 'right' ? 'end' : 'middle';
  const maxTextWidth = appearance.pictogramPosition === 'top' ? w - pad * 2 : w - pad * 2 - 36 * s;
  const finalLines = wrap(config.message || '', Math.max(8, Math.floor(maxTextWidth / (5.5 * s))));
  const finalBlockH = finalLines.length * lineH;
  const adjustedTextY = appearance.pictogramPosition === 'top' && hasIcon ? iconY + 20 * s + textGap + finalBlockH / 2 : textY;

  finalLines.forEach((line, index) => elements.push({
    type: 'text',
    x: textX,
    y: adjustedTextY + (index - (finalLines.length - 1) / 2) * lineH,
    text: line,
    fontSize: textSize,
    fontWeight: 800,
    fill: '#000',
    fontFamily: 'Barlow Semi Condensed, sans-serif',
    anchor: textAnchor,
    dominantBaseline: 'middle',
  }));

  const composition: Composition = { widthMm: w, heightMm: h, elements };
  return renderCompositionToSvg(composition);
}
