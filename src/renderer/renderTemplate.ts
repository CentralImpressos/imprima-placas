import type { SignRenderConfig } from '../types';
import type { GraphicElement } from '../composition';
import { renderCompositionToSvg } from '../composition';
import { getFrameGeometry, insetPolygon } from './geometry';

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const cmykToRgb = ({ c, m, y, k }: { c: number; m: number; y: number; k: number }) => {
  const C = clamp(c, 0, 100);
  const M = clamp(m, 0, 100);
  const Y = clamp(y, 0, 100);
  const K = clamp(k, 0, 100);

  const presets: Array<{ c: number; m: number; y: number; k: number; rgb: string }> = [
    { c: 0, m: 0, y: 0, k: 100, rgb: 'rgb(0,0,0)' },
    { c: 0, m: 0, y: 0, k: 0, rgb: 'rgb(255,255,255)' },
    { c: 100, m: 100, y: 0, k: 0, rgb: 'rgb(46,48,146)' },
    { c: 100, m: 0, y: 0, k: 0, rgb: 'rgb(0,174,239)' },
    { c: 100, m: 0, y: 100, k: 0, rgb: 'rgb(0,166,81)' },
    { c: 0, m: 0, y: 100, k: 0, rgb: 'rgb(255,242,0)' },
    { c: 0, m: 100, y: 100, k: 0, rgb: 'rgb(237,28,36)' },
    { c: 0, m: 100, y: 0, k: 0, rgb: 'rgb(236,0,140)' },
  ];

  const preset = presets.find(
    (item) =>
      item.c === C &&
      item.m === M &&
      item.y === Y &&
      item.k === K,
  );

  if (preset) return preset.rgb;

  const cmykC = C / 100;
  const cmykM = M / 100;
  const cmykY = Y / 100;
  const cmykK = K / 100;

  return `rgb(${Math.round(255 * (1 - cmykC) * (1 - cmykK))},${Math.round(255 * (1 - cmykM) * (1 - cmykK))},${Math.round(255 * (1 - cmykY) * (1 - cmykK))})`;
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
// Barlow Semi Condensed Bold — fator conservador para manter o dimensionamento natural.
const CHAR_WIDTH_FACTOR = 0.56;

function longestWordLen(message: string): number {
  return message.toUpperCase().split(/[\s\r\n]+/).filter(Boolean).reduce((max, word) => Math.max(max, word.length), 1);
}
function measureTextWidth(lines: string[], fontSize: number): number {
  const longest = lines.reduce((max, line) => Math.max(max, line.length), 0);
  return longest * fontSize * CHAR_WIDTH_FACTOR;
}
function fitText(message: string, preferredFontSize: number, maxWidthMm: number, maxHeightMm: number, minFontSize = 9) {
  const maxWord = longestWordLen(message);
  let fontSize = Math.min(preferredFontSize, maxWidthMm / (maxWord * CHAR_WIDTH_FACTOR));
  for (let i = 0; i < 16; i += 1) {
    const maxChars = Math.max(maxWord, Math.floor(maxWidthMm / Math.max(1, fontSize * CHAR_WIDTH_FACTOR)));
    const lines = wrap(message, maxChars);
    const lineHeight = fontSize * 1.1;
    const width = measureTextWidth(lines, fontSize);
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
    const currentW = measureTextWidth(fitted.lines, fitted.fontSize);
    const currentH = fitted.lines.length * fitted.lineHeight;
    if (currentW >= widthCap * 0.96 || currentH >= maxHeightMm * 0.98) break;
    const grow = Math.min(widthCap / Math.max(1, currentW), maxHeightMm / Math.max(1, currentH));
    if (grow <= 1.02) break;
    fitted = fitText(message, fitted.fontSize * Math.min(grow, 1.15), widthCap, maxHeightMm, minFontSize);
  }
  return fitted;
}

function maxContentRadius(
  frameType: SignRenderConfig['frameType'],
  w: number,
  h: number,
  margin: number,
  pad: number,
  stroke: number,
): number {
  if (frameType === 'diamond') {
    const size = Math.min(w, h);
    const inradius = size / (2 * Math.SQRT2);
    return Math.max(8, inradius - margin - pad - stroke * 0.5);
  }
  if (frameType === 'circular') {
    const outer = Math.min(w, h) / 2;
    return Math.max(8, outer - margin - pad - stroke * 0.5);
  }
  if (frameType === 'triangle') {
    const inradius = h / 3;
    return Math.max(8, inradius - margin - pad - stroke * 0.5);
  }
  return Math.min(w, h) / 2 - margin - pad;
}

export function renderTemplate(config: SignRenderConfig): string {
  const geometry = getFrameGeometry(config.frameType, config.widthMm, config.heightMm);
  const { width: w, height: h, centerX: cx, centerY: cy } = geometry;
  const { frameType, appearance } = config;
  const frame = cmykToRgb(appearance.frameColor);
  const bg = cmykToRgb(appearance.backgroundColor);
  const iconRgb = cmykToRgb(appearance.iconColor);
  const textRgb = cmykToRgb(appearance.textColor ?? { c: 0, m: 0, y: 0, k: 100 });
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
      headerLines.forEach((line, index) => {
        const opticalHeaderShift = headerLines.length === 1 ? 1 * s : 0.5 * s;
        elements.push({ type: 'text', x: cx, y: margin + headerH / 2 + opticalHeaderShift + (index - (headerLines.length - 1) / 2) * headerLineH, text: line, fontSize: headingFit.fontSize, fontWeight: 800, fill: bg, fontFamily: 'Barlow Semi Condensed, sans-serif', anchor: 'middle', dominantBaseline: 'middle' });
      });
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

  // Área de conteúdo com margens simétricas (centro visual correto no cabeçalho).
  const bodyPad = Math.max(pad * 1.6, Math.min(w, h) * 0.04);
  const contentTop = frameType === 'header' ? margin + 30 * s + bodyPad : margin + pad;
  const contentBottom = h - margin - bodyPad;
  const contentLeft = margin + stroke + pad;
  const contentRight = w - margin - stroke - pad;
  const hasIcon = config.showIcon && Boolean(config.iconSvg);
  const isNonRectangular = frameType === 'circular' || frameType === 'diamond' || frameType === 'triangle';
  const usableWidth = Math.max(1, isNonRectangular ? Math.min(w, h) - 2 * (margin + pad) : contentRight - contentLeft);
  const contentCenterX = (contentLeft + contentRight) / 2;
  const needsRing = appearance.circle || appearance.prohibition;
  const position = appearance.pictogramPosition;
  const letterBoost = isLetterSlug(config.iconSlug) ? 1.92 : 1;
  const message = config.message.trim();

  if (!message && hasIcon) {
    // Cabeçalho: centraliza na área branca abaixo da faixa (não no centro da placa).
    // Demais formas: centro geométrico / óptico habitual.
    let centerY: number;
    let maxR: number;
    if (frameType === 'header') {
      centerY = (contentTop + contentBottom) / 2;
      const areaH = Math.max(1, contentBottom - contentTop);
      const areaW = Math.max(1, contentRight - contentLeft);
      const half = Math.min(areaW, areaH) / 2;
      // Reserva um pouco para o stroke do anel e respiro da moldura.
      maxR = half * (needsRing ? 0.86 : 0.9);
    } else if (frameType === 'triangle') {
      centerY = h * (2 / 3);
      maxR = maxContentRadius(frameType, w, h, margin, pad, stroke);
    } else {
      centerY = cy;
      maxR = maxContentRadius(frameType, w, h, margin, pad, stroke);
    }
    const pictSize = needsRing ? maxR * 2 : maxR * 2 * 0.9;
    elements.push(...iconElements(
      config.iconSvg,
      isNonRectangular ? cx : contentCenterX,
      centerY,
      computeIconScale(pictSize, needsRing, letterBoost),
      needsRing ? pictSize / 2 : 0,
      appearance.circle,
      appearance.prohibition,
      iconRgb,
    ));
    return renderCompositionToSvg({ widthMm: w, heightMm: h, elements });
  }

  const layoutTop = contentTop;
  const layoutBottom = contentBottom;
  const layoutHeight = Math.max(1, layoutBottom - layoutTop);
  let finalLines: string[] = [];
  let finalFontSize = 12;
  let finalLineHeight = 14;
  let textX = contentCenterX;
  let textY = layoutTop + layoutHeight / 2;
  const wordCount = message.split(/\s+/).filter(Boolean).length;

  if (hasIcon && position === 'top') {
    const preferredPict = Math.min(usableWidth * 0.8, layoutHeight * 0.56);
    const minPict = Math.min(usableWidth * 0.36, layoutHeight * 0.24);
    const gap = 6 * s;
    let pictSize = preferredPict;
    const ringOut = (size: number) => (needsRing ? Math.max(1.8, (size / 2) * 0.16) * 0.5 : 0);
    let textMaxH = Math.max(18, layoutHeight - pictSize - ringOut(pictSize) * 2 - gap);
    let fitted = fitTextToTargetWidth(
      message,
      wordCount <= 2 ? Math.min(usableWidth, Math.max(pictSize, usableWidth * 0.88)) : Math.min(usableWidth, Math.max(pictSize, usableWidth * 0.94)),
      usableWidth,
      textMaxH,
    );
    let textH = fitted.lines.length * fitted.lineHeight;
    let pictExtent = pictSize + ringOut(pictSize) * 2;
    let blockH = pictExtent + gap + textH;
    if (blockH > layoutHeight && pictSize > minPict) {
      pictSize = clamp(layoutHeight - textH - gap - ringOut(preferredPict) * 2, minPict, preferredPict);
      textMaxH = Math.max(16, layoutHeight - pictSize - ringOut(pictSize) * 2 - gap);
      fitted = fitTextToTargetWidth(message, Math.min(usableWidth, Math.max(pictSize, usableWidth * 0.94)), usableWidth, textMaxH);
      textH = fitted.lines.length * fitted.lineHeight;
      pictExtent = pictSize + ringOut(pictSize) * 2;
      blockH = pictExtent + gap + textH;
    }
    const groupScale = blockH > layoutHeight ? layoutHeight / blockH : 1;
    pictSize *= groupScale;
    fitted = { lines: fitted.lines, fontSize: Math.max(8, fitted.fontSize * groupScale), lineHeight: Math.max(9, fitted.lineHeight * groupScale) };
    textH = fitted.lines.length * fitted.lineHeight;
    pictExtent = pictSize + ringOut(pictSize) * 2;
    blockH = pictExtent + gap * groupScale + textH;
    const free = Math.max(0, layoutHeight - blockH);
    const blockTop = layoutTop + free * 0.5;
    const iconY = blockTop + ringOut(pictSize) + pictSize / 2;
    textY = blockTop + pictExtent + gap * groupScale + textH / 2;
    textX = contentCenterX;
    finalLines = fitted.lines; finalFontSize = fitted.fontSize; finalLineHeight = fitted.lineHeight;
    elements.push(...iconElements(config.iconSvg, contentCenterX, iconY, computeIconScale(pictSize, needsRing, letterBoost), needsRing ? pictSize / 2 : 0, appearance.circle, appearance.prohibition, iconRgb));
  } else if (hasIcon && (position === 'left' || position === 'right')) {
    // Paisagem e retrato: bloco [pictograma + texto] cabe inteiro na área útil e fica centralizado.
    const preferredPict = Math.min(layoutHeight * 0.72, usableWidth * 0.3);
    const minPict = Math.min(layoutHeight * 0.32, usableWidth * 0.14);
    const gap = 5 * s;
    let pictSize = preferredPict;
    let textAreaW = Math.max(24 * s, usableWidth - pictSize - gap);
    let fitted = fitTextToTargetWidth(message, textAreaW * 0.95, textAreaW, layoutHeight);
    let textH = fitted.lines.length * fitted.lineHeight;
    let textW = measureTextWidth(fitted.lines, fitted.fontSize);
    let blockW = pictSize + gap + textW;
    let blockH = Math.max(pictSize, textH);

    // Se estoura a largura, reduz pictograma e refaz o texto.
    if (blockW > usableWidth && pictSize > minPict) {
      const maxTextForMinPict = Math.max(24 * s, usableWidth - minPict - gap);
      fitted = fitTextToTargetWidth(message, maxTextForMinPict * 0.95, maxTextForMinPict, layoutHeight);
      textW = measureTextWidth(fitted.lines, fitted.fontSize);
      textH = fitted.lines.length * fitted.lineHeight;
      pictSize = clamp(usableWidth - gap - textW, minPict, preferredPict);
      textAreaW = Math.max(24 * s, usableWidth - pictSize - gap);
      fitted = fitTextToTargetWidth(message, textAreaW * 0.95, textAreaW, layoutHeight);
      textW = measureTextWidth(fitted.lines, fitted.fontSize);
      textH = fitted.lines.length * fitted.lineHeight;
      blockW = pictSize + gap + textW;
      blockH = Math.max(pictSize, textH);
    }

    // Escala final se ainda passar (altura ou largura).
    let groupScale = 1;
    if (blockW > usableWidth || blockH > layoutHeight) {
      groupScale = Math.min(usableWidth / Math.max(1, blockW), layoutHeight / Math.max(1, blockH));
    }
    pictSize *= groupScale;
    fitted = { lines: fitted.lines, fontSize: Math.max(8, fitted.fontSize * groupScale), lineHeight: Math.max(9, fitted.lineHeight * groupScale) };
    textW = measureTextWidth(fitted.lines, fitted.fontSize);
    textH = fitted.lines.length * fitted.lineHeight;
    const effectiveGap = gap * groupScale;
    blockW = pictSize + effectiveGap + textW;
    blockH = Math.max(pictSize, textH);

    // Centraliza o bloco horizontal e verticalmente na área útil.
    const blockLeft = contentLeft + Math.max(0, (usableWidth - blockW) / 2);
    const blockTop = layoutTop + Math.max(0, (layoutHeight - blockH) / 2);
    const iconY = blockTop + blockH / 2;
    textY = iconY;
    finalLines = fitted.lines; finalFontSize = fitted.fontSize; finalLineHeight = fitted.lineHeight;
    const ringRadius = pictSize / 2;
    const iconScale = computeIconScale(pictSize, needsRing, letterBoost);

    if (position === 'left') {
      const iconX = blockLeft + ringRadius;
      textX = iconX + ringRadius + effectiveGap; // anchor start
      elements.push(...iconElements(config.iconSvg, iconX, iconY, iconScale, needsRing ? ringRadius : 0, appearance.circle, appearance.prohibition, iconRgb));
    } else {
      const iconX = blockLeft + blockW - ringRadius;
      textX = iconX - ringRadius - effectiveGap; // anchor end
      elements.push(...iconElements(config.iconSvg, iconX, iconY, iconScale, needsRing ? ringRadius : 0, appearance.circle, appearance.prohibition, iconRgb));
    }
  } else {
    const fitted = fitTextToTargetWidth(message, usableWidth * 0.95, usableWidth, layoutHeight);
    finalLines = fitted.lines; finalFontSize = fitted.fontSize; finalLineHeight = fitted.lineHeight;
    const textH = finalLines.length * finalLineHeight;
    textX = contentCenterX;
    textY = layoutTop + (layoutHeight - textH) / 2 + textH / 2;
  }

  if (message && frameType === 'simple') {
    textY += 2 * s;
  }
  const textAnchor = position === 'left' ? 'start' : position === 'right' ? 'end' : 'middle';
  finalLines.forEach((line, index) => elements.push({
    type: 'text',
    x: textX,
    y: textY + (index - (finalLines.length - 1) / 2) * finalLineHeight,
    text: line,
    fontSize: finalFontSize,
    fontWeight: 800,
    fill: textRgb,
    fontFamily: 'Barlow Semi Condensed, sans-serif',
    anchor: textAnchor,
    dominantBaseline: 'middle',
    textLength: textAnchor === 'middle' ? undefined : measureTextWidth([line], finalFontSize),
    lengthAdjust: textAnchor === 'middle' ? undefined : 'spacingAndGlyphs',
  }));
  return renderCompositionToSvg({ widthMm: w, heightMm: h, elements });
}
