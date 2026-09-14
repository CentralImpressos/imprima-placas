import type { SignRenderConfig } from '../types';
import type { Composition, GraphicElement } from '../composition';
import { renderCompositionToSvg } from '../composition';

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const cmykToRgb = ({ c, m, y, k }: { c: number; m: number; y: number; k: number }) => {
  const C = clamp(c, 0, 100) / 100, M = clamp(m, 0, 100) / 100, Y = clamp(y, 0, 100) / 100, K = clamp(k, 0, 100) / 100;
  return `rgb(${Math.round(255 * (1 - C) * (1 - K))},${Math.round(255 * (1 - M) * (1 - K))},${Math.round(255 * (1 - Y) * (1 - K))})`;
};
const scaleFor = (w: number, h: number) => Math.min(w, h) / 100;
const wrap = (text: string, maxChars: number) => text.split(/\r?\n/).flatMap((line) => {
  const words = line.trim().toUpperCase().split(/\s+/).filter(Boolean); const out: string[] = []; let current = '';
  words.forEach((word) => { const next = current ? `${current} ${word}` : word; if (next.length > maxChars && current) { out.push(current); current = word; } else current = next; });
  if (current) out.push(current); return out;
});

export function renderTemplate(config: SignRenderConfig): string {
  const { widthMm: w, heightMm: h, frameType, appearance } = config;
  const frame = cmykToRgb(appearance.frameColor); const bg = cmykToRgb(appearance.backgroundColor);
  const s = scaleFor(w, h); const margin = 5 * s; const stroke = 2 * s; const pad = 7 * s;
  const cx = w / 2, cy = h / 2; const elements: GraphicElement[] = [{ type: 'rect', x: 0, y: 0, width: w, height: h, fill: bg }];
  const inner = { x: margin, y: margin, width: w - margin * 2, height: h - margin * 2 };

  if (frameType === 'simple') elements.push({ type: 'rect', ...inner, fill: 'none', stroke: frame, strokeWidth: stroke, rx: 4 * s, ry: 4 * s });
  if (frameType === 'header') {
    elements.push({ type: 'rect', ...inner, fill: 'none', stroke: frame, strokeWidth: stroke, rx: 4 * s, ry: 4 * s });
    const headerH = 28 * s;
    elements.push({ type: 'rect', x: margin, y: margin, width: inner.width, height: headerH, fill: frame, rx: 4 * s, ry: 4 * s });
    elements.push({ type: 'rect', x: margin, y: margin + headerH - 4 * s, width: inner.width, height: 4 * s, fill: frame });
    elements.push({ type: 'text', x: cx, y: margin + headerH / 2, text: (config.heading || 'AVISO').toUpperCase(), fontSize: 16 * s, fontWeight: 800, fill: '#fff', fontFamily: 'Barlow Semi Condensed, sans-serif', anchor: 'middle', dominantBaseline: 'middle' });
  }
  if (frameType === 'circular') {
    const r = Math.min(w, h) / 2 - margin; elements.push({ type: 'circle', cx, cy, r, fill: bg, stroke: frame, strokeWidth: stroke });
  }
  if (frameType === 'diamond') {
    const d = Math.min(w, h) / 2 - margin; elements.push({ type: 'polygon', points: `${cx},${cy-d} ${cx+d},${cy} ${cx},${cy+d} ${cx-d},${cy}`, fill: bg, stroke: frame, strokeWidth: stroke });
  }
  if (frameType === 'triangle') {
    const top = margin; const baseY = h - margin; elements.push({ type: 'polygon', points: `${cx},${top} ${w-margin},${baseY} ${margin},${baseY}`, fill: bg, stroke: frame, strokeWidth: stroke });
  }

  const contentTop = frameType === 'header' ? margin + 32 * s : margin + pad;
  const contentBottom = h - margin - pad;
  const lines = wrap(config.message || '', Math.max(8, Math.floor((w - pad * 2) / (5.5 * s))));
  const textGap = 7 * s; const textSize = clamp(10 * s, 8, 42); const lineH = textSize * 1.12;
  const hasIcon = config.showIcon && Boolean(config.iconSvg);
  let textX = cx, textY = (contentTop + contentBottom) / 2;
  let iconX = cx, iconY = contentTop + (contentBottom - contentTop) * 0.34; const iconScale = 3.8 * s;
  const blockH = lines.length * lineH;

  if (hasIcon && appearance.pictogramPosition === 'top') {
    iconY = contentTop + Math.max(20 * s, (contentBottom - contentTop - blockH) * 0.35); textY = iconY + 24 * s + textGap + blockH / 2;
  } else if (hasIcon && appearance.pictogramPosition === 'left') {
    iconX = margin + pad + 22 * s; textX = iconX + 30 * s; textY = (contentTop + contentBottom) / 2;
  } else if (hasIcon && appearance.pictogramPosition === 'right') {
    iconX = w - margin - pad - 22 * s; textX = iconX - 30 * s; textY = (contentTop + contentBottom) / 2;
  }

  if (hasIcon) elements.push({ type: 'icon', x: iconX, y: iconY, scale: iconScale, color: '#000', svg: config.iconSvg });
  lines.forEach((line, i) => elements.push({ type: 'text', x: textX, y: textY + (i - (lines.length - 1) / 2) * lineH, text: line, fontSize: textSize, fontWeight: 800, fill: '#000', fontFamily: 'Barlow Semi Condensed, sans-serif', anchor: 'middle', dominantBaseline: 'middle' }));

  if (appearance.prohibition) {
    const pr = Math.min(w, h) * 0.29; const pcx = appearance.pictogramPosition === 'left' ? w * 0.28 : appearance.pictogramPosition === 'right' ? w * 0.72 : cx; const pcy = appearance.pictogramPosition === 'top' ? contentTop + pr : cy;
    const prStroke = 5 * s; elements.push({ type: 'circle', cx: pcx, cy: pcy, r: pr, fill: 'none', stroke: 'rgb(220,0,0)', strokeWidth: prStroke });
    elements.push({ type: 'group', transform: `rotate(45 ${pcx} ${pcy})`, children: [{ type: 'rect', x: pcx - prStroke / 2, y: pcy - pr, width: prStroke, height: pr * 2, fill: 'rgb(220,0,0)' }] });
  }
  const composition: Composition = { widthMm: w, heightMm: h, elements };
  return renderCompositionToSvg(composition);
}
