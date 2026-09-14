import type { SignRenderConfig } from '../types';
import type { GraphicElement } from '../composition';
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
  const limit = Math.max(1, maxChars);
  return text.split(/\r?\n/).flatMap((line) => {
    const words = line.trim().toUpperCase().split(/\s+/).filter(Boolean);
    if (!words.length) return [''];
    const output: string[] = [];
    let current = '';
    words.forEach((word) => {
      if (word.length > limit) {
        if (current) output.push(current);
        current = '';
        for (let i = 0; i < word.length; i += limit) output.push(word.slice(i, i + limit));
        return;
      }
      const next = current ? `${current} ${word}` : word;
      if (next.length > limit && current) { output.push(current); current = word; }
      else current = next;
    });
    if (current) output.push(current);
    return output;
  });
}

function pointsString(points: Array<{ x: number; y: number }>) { return points.map((point) => `${point.x},${point.y}`).join(' '); }

function iconElements(svg: string, x: number, y: number, iconScale: number, ringRadiusMm: number, circle: boolean, prohibition: boolean, iconColor = '#000'): GraphicElement[] {
  if (!svg) return [];
  const elements: GraphicElement[] = [{ type: 'icon', x, y, scale: iconScale, color: iconColor, svg }];
  if (!circle && !prohibition) return elements;
  const ringStroke = Math.max(1.8, ringRadiusMm * 0.16);
  elements.push({ type: 'circle', cx: x, cy: y, r: ringRadiusMm, fill: 'none', stroke: 'rgb(220,0,0)', strokeWidth: ringStroke });
  if (prohibition) {
    elements.push({ type: 'group', transform: `rotate(-45 ${x} ${y})`, children: [{ type: 'rect', x: x - ringStroke / 2, y: y - ringRadiusMm, width: ringStroke, height: ringRadiusMm * 2, fill: 'rgb(220,0,0)' }] });
  }
  return elements;
}

function isLetterSlug(slug?: string): boolean { return Boolean(slug && (/mdi:alpha-[a-z](?:-|$)/i.test(slug) || /letter-/i.test(slug))); }
function computeIconScale(blockWidth: number, needsRing: boolean, letterBoost: number): number {
  if (needsRing) return (((blockWidth / 2) * 2 * 0.84 * 0.78) / 24) * letterBoost;
  return ((blockWidth * 0.92) / 24) * letterBoost;
}
const CHAR_WIDTH_FACTOR = 0.48;

function longestWordLen(message: string): number {
  return message.toUpperCase().split(/[\s\r\n]+/).filter(Boolean).reduce((max, word) => Math.max(max, word.length), 1);
}
function fitText(message: string, preferredFontSize: number, maxWidthMm: number, maxHeightMm: number, minFontSize = 9) {
  const maxWord = longestWordLen(message);
  let fontSize = Math.min(preferredFontSize, maxWidthMm / (maxWord * CHAR_WIDTH_FACTOR));
  for (let i = 0; i < 16; i += 1) {
    const maxChars = Math.max(maxWord, Math.floor(maxWidthMm / Math.max(1, fontSize * CHAR_WIDTH_FACTOR)));
    const lines = wrap(message, maxChars);
    const lineHeight = fontSize * 1.1;
    const longest = lines.reduce((max, line) => Math.max(max, line.length), 0);
    const width = longest * fontSize * CHAR_WIDTH_FACTOR;
    const height = Math.max(lineHeight, lines.length * lineHeight);
    if ((width <= maxWidthMm + 0.01 && height <= maxHeightMm + 0.01) || fontSize <= minFontSize) return { lines, fontSize, lineHeight };
    const widthFactor = width <= maxWidthMm ? 1 : maxWidthMm / Math.max(1, width);
    const heightFactor = height <= maxHeightMm ? 1 : maxHeightMm / Math.max(1, height);
    fontSize = Math.max(minFontSize, fontSize * Math.min(widthFactor, heightFactor) * 0.97);
  }
  const maxChars = Math.max(1, Math.floor(maxWidthMm / Math.max(1, fontSize * CHAR_WIDTH_FACTOR)));
  return { lines: wrap(message, maxChars), fontSize, lineHeight: fontSize * 1.1 };
}
function fitTextToTargetWidth(message: string, targetWidthMm: number, maxWidthMm: number, maxHeightMm: number, minFontSize = 9) {
  const widthCap = Math.min(targetWidthMm, maxWidthMm);
  const seedFont = widthCap / (12 * CHAR_WIDTH_FACTOR);
  let fitted = fitText(message, seedFont, widthCap, maxHeightMm, minFontSize);
  for (let i = 0; i < 8; i += 1) {
    const longest = fitted.lines.reduce((max, line) => Math.max(max, line.length), 1);
    const currentW = longest * fitted.fontSize * CHAR_WIDTH_FACTOR;
    const currentH = fitted.lines.length * fitted.lineHeight;
    if (currentW >= widthCap * 0.96 || currentH >= maxHeightMm * 0.98) break;
    const grow = Math.min(widthCap / Math.max(1, currentW), maxHeightMm / Math.max(1, currentH));
    if (grow <= 1.02) break;
    fitted = fitText(message, fitted.fontSize * Math.min(grow, 1.15), widthCap, maxHeightMm, minFontSize);
  }
  return fitted;
}

export function renderTemplate(config: SignRenderConfig): string {
  const geometry = getFrameGeometry(config.frameType, config.widthMm, config.heightMm);
  const { width: w, height: h, centerX: cx, centerY: cy } = geometry;
  const { frameType, appearance } = config;
  const frame = cmykToRgb(appearance.frameColor);
  const bg = cmykToRgb(appearance.backgroundColor);
  const iconRgb = cmykToRgb(appearance.iconColor);
  const s = scaleFor(w, h);
  const margin = 4 * s;
  const stroke = 2 * s;
  const pad = 2.5 * s;
  const elements: GraphicElement[] = [];
  const hasOptionalFrame = frameType === 'simple' || frameType === 'header' || appearance.frameEnabled;

  if (frameType === 'simple' || frameType === 'header') {
    elements.push({ type: 'rect', x: 0, y: 0, width: w, height: h, fill: bg });
    elements.push({ type: 'rect', x: 0.25, y: 0.25, width: w - 0.5, height: h - 0.5, fill: 'none', stroke: 'rgb(179,179,179)', strokeWidth: 0.5 });
    const inner = { x: margin, y: margin, width: w - margin * 2, height: h - margin * 2 };
    elements.push({ type: 'rect', ...inner, fill: 'none', stroke: frame, strokeWidth: stroke, rx: 4 * s, ry: 4 * s });
    if (frameType === 'header') {
      const headerH = 30 * s;
      const headerPadX = 1 * s;
      const headerPadY = 0.8 * s;
      const headerMaxW = Math.max(20, inner.width - headerPadX * 2);
      const headingText = (config.heading || 'AVISO').toUpperCase();
      const headingFit = fitTextToTargetWidth(headingText, headerMaxW, headerMaxW, Math.max(10, headerH - headerPadY * 2), 7);
      elements.push({ type: 'rect', x: margin, y: margin, width: inner.width, height: headerH, fill: frame, rx: 4 * s, ry: 4 * s });
      elements.push({ type: 'rect', x: margin, y: margin + headerH - 4 * s, width: inner.width, height: 4 * s, fill: frame });
      const headerLines = headingFit.lines.filter(Boolean);
      const headerLineH = headingFit.lineHeight;
      headerLines.forEach((line, index) => elements.push({ type: 'text', x: cx, y: margin + headerH / 2 + (index - (headerLines.length - 1) / 2) * headerLineH, text: line, fontSize: headingFit.fontSize, fontWeight: 800, fill: bg, fontFamily: 'Barlow Semi Condensed, sans-serif', anchor: 'middle', dominantBaseline: 'middle' }));
    }
  } else if (frameType === 'circular') {
    const outerRadius = geometry.radius!;
    elements.push({ type: 'circle', cx, cy, r: outerRadius, fill: bg });
    if (hasOptionalFrame) elements.push({ type: 'circle', cx, cy, r: outerRadius - margin, fill: 'none', stroke: frame, strokeWidth: stroke });
  } else if (frameType === 'diamond' || frameType === 'triangle') {
    const outerPoints = geometry.points!;
    elements.push({ type: 'polygon', points: pointsString(outerPoints), fill: bg });
    if (hasOptionalFrame) elements.push({ type: 'polygon', points: pointsString(insetPolygon(outerPoints, margin)), fill: 'none', stroke: frame, strokeWidth: stroke, strokeLinejoin: 'round' });
  }

  const contentTop = frameType === 'header' ? margin + 30 * s : margin + pad;
  const contentBottom = frameType === 'header' ? h - margin : h - margin - pad;
  const contentLeft = margin + stroke + pad;
  const contentRight = w - margin - stroke - pad;
  const hasIcon = config.showIcon && Boolean(config.iconSvg);
  const isNonRectangular = frameType === 'circular' || frameType === 'diamond' || frameType === 'triangle';
  const usableWidth = isNonRectangular ? Math.min(w, h) - 2 * (margin + pad) : contentRight - contentLeft;
  const usableHeight = Math.max(1, contentBottom - contentTop);
  const contentCenterX = (contentLeft + contentRight) / 2;
  const needsRing = appearance.circle || appearance.prohibition;
  const position = appearance.pictogramPosition;
  const letterBoost = isLetterSlug(config.iconSlug) ? 1.6 : 1;
  const message = config.message.trim();

  if (!message && hasIcon) {
    const centerY = frameType === 'triangle' ? h * (2 / 3) : (frameType === 'header' ? (contentTop + contentBottom) / 2 : cy);
    const pictSize = Math.min(usableWidth * 0.78, usableHeight * 0.78);
    elements.push(...iconElements(config.iconSvg, isNonRectangular ? cx : contentCenterX, centerY, computeIconScale(pictSize, needsRing, letterBoost), needsRing ? pictSize / 2 : 0, appearance.circle, appearance.prohibition, iconRgb));
    return renderCompositionToSvg({ widthMm: w, heightMm: h, elements });
  }

  let finalLines: string[] = [];
  let finalFontSize = 12;
  let finalLineHeight = 14;
  let textX = contentCenterX;
  let textY = contentTop + usableHeight / 2;
  const wordCount = message.split(/\s+/).filter(Boolean).length;

  if (hasIcon && position === 'top') {
    const preferredPict = Math.min(usableWidth * 0.7, usableHeight * 0.48);
    const minPict = Math.min(usableWidth * 0.35, usableHeight * 0.22);
    const gap = 7 * s;
    let pictSize = preferredPict;
    let textMaxH = Math.max(20, usableHeight - pictSize - gap);
    let fitted = fitTextToTargetWidth(message, wordCount <= 2 ? Math.min(usableWidth, pictSize) : Math.min(usableWidth, Math.max(pictSize, usableWidth * 0.92)), usableWidth, textMaxH);
    let textH = fitted.lines.length * fitted.lineHeight;
    let blockH = pictSize + gap + textH;
    if (blockH > usableHeight && pictSize > minPict) {
      pictSize = clamp(usableHeight - textH - gap, minPict, preferredPict);
      textMaxH = Math.max(18, usableHeight - pictSize - gap);
      fitted = fitTextToTargetWidth(message, Math.min(usableWidth, Math.max(pictSize, usableWidth * 0.92)), usableWidth, textMaxH);
      textH = fitted.lines.length * fitted.lineHeight;
      blockH = pictSize + gap + textH;
    }
    const groupScale = blockH > usableHeight ? usableHeight / blockH : 1;
    pictSize *= groupScale;
    fitted = { lines: fitted.lines, fontSize: Math.max(8, fitted.fontSize * groupScale), lineHeight: Math.max(9, fitted.lineHeight * groupScale) };
    textH = fitted.lines.length * fitted.lineHeight;
    const blockTop = contentTop + (usableHeight - (pictSize + gap * groupScale + textH)) / 2;
    const iconY = blockTop + pictSize / 2;
    textY = blockTop + pictSize + gap * groupScale + textH / 2;
    textX = contentCenterX;
    finalLines = fitted.lines; finalFontSize = fitted.fontSize; finalLineHeight = fitted.lineHeight;
    elements.push(...iconElements(config.iconSvg, contentCenterX, iconY, computeIconScale(pictSize, needsRing, letterBoost), needsRing ? pictSize / 2 : 0, appearance.circle, appearance.prohibition, iconRgb));
  } else if (hasIcon && (position === 'left' || position === 'right')) {
    const preferredPict = Math.min(usableHeight * 0.64, usableWidth * 0.36);
    const minPict = Math.min(usableHeight * 0.28, usableWidth * 0.18);
    const gap = 6 * s;
    let pictSize = preferredPict;
    let textAreaW = Math.max(36 * s, usableWidth - pictSize - gap);
    let fitted = fitTextToTargetWidth(message, textAreaW * 0.88, textAreaW, usableHeight);
    let textH = fitted.lines.length * fitted.lineHeight;
    let textW = fitted.lines.reduce((m, l) => Math.max(m, l.length), 0) * fitted.fontSize * CHAR_WIDTH_FACTOR;
    let blockW = pictSize + gap + textW;
    let blockH = Math.max(pictSize, textH);
    if (blockW > usableWidth && pictSize > minPict) {
      pictSize = clamp(usableWidth - gap - textW, minPict, preferredPict);
      textAreaW = Math.max(36 * s, usableWidth - pictSize - gap);
      fitted = fitTextToTargetWidth(message, textAreaW * 0.88, textAreaW, usableHeight);
      textH = fitted.lines.length * fitted.lineHeight;
      textW = fitted.lines.reduce((m, l) => Math.max(m, l.length), 0) * fitted.fontSize * CHAR_WIDTH_FACTOR;
      blockW = pictSize + gap + textW;
      blockH = Math.max(pictSize, textH);
    }
    const groupScale = blockW > usableWidth || blockH > usableHeight ? Math.min(usableWidth / Math.max(1, blockW), usableHeight / Math.max(1, blockH)) : 1;
    pictSize *= groupScale;
    fitted = { lines: fitted.lines, fontSize: Math.max(8, fitted.fontSize * groupScale), lineHeight: Math.max(9, fitted.lineHeight * groupScale) };
    textH = fitted.lines.length * fitted.lineHeight;
    textW = fitted.lines.reduce((m, l) => Math.max(m, l.length), 0) * fitted.fontSize * CHAR_WIDTH_FACTOR;
    blockW = pictSize + gap * groupScale + textW;
    blockH = Math.max(pictSize, textH);
    const blockLeft = contentLeft + (usableWidth - blockW) / 2;
    const blockTop = contentTop + (usableHeight - blockH) / 2;
    const iconY = blockTop + blockH / 2;
    textY = iconY;
    finalLines = fitted.lines; finalFontSize = fitted.fontSize; finalLineHeight = fitted.lineHeight;
    const ringRadius = pictSize / 2;
    const iconScale = computeIconScale(pictSize, needsRing, letterBoost);
    const effectiveGap = gap * groupScale;
    if (position === 'left') {
      const iconX = blockLeft + ringRadius;
      textX = iconX + ringRadius + effectiveGap;
      elements.push(...iconElements(config.iconSvg, iconX, iconY, iconScale, needsRing ? ringRadius : 0, appearance.circle, appearance.prohibition, iconRgb));
    } else {
      const iconX = blockLeft + blockW - ringRadius;
      textX = iconX - ringRadius - effectiveGap;
      elements.push(...iconElements(config.iconSvg, iconX, iconY, iconScale, needsRing ? ringRadius : 0, appearance.circle, appearance.prohibition, iconRgb));
    }
  } else {
    const fitted = fitTextToTargetWidth(message, usableWidth * 0.95, usableWidth, usableHeight);
    finalLines = fitted.lines; finalFontSize = fitted.fontSize; finalLineHeight = fitted.lineHeight;
    const textH = finalLines.length * finalLineHeight;
    textX = contentCenterX;
    textY = contentTop + (usableHeight - textH) / 2 + textH / 2;
  }

  if (message && (frameType === 'simple' || frameType === 'header')) {
    textY += 1.5 * s;
  }
  const textAnchor = position === 'left' ? 'start' : position === 'right' ? 'end' : 'middle';
  finalLines.forEach((line, index) => elements.push({ type: 'text', x: textX, y: textY + (index - (finalLines.length - 1) / 2) * finalLineHeight, text: line, fontSize: finalFontSize, fontWeight: 800, fill: '#000', fontFamily: 'Barlow Semi Condensed, sans-serif', anchor: textAnchor, dominantBaseline: 'middle' }));
  return renderCompositionToSvg({ widthMm: w, heightMm: h, elements });
}
