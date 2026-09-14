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

/** Quebra por espaços e, se necessário, parte palavras longas demais. */
function wrap(text: string, maxChars: number) {
  const limit = Math.max(1, maxChars);
  return text.split(/\r?\n/).flatMap((line) => {
    const words = line.trim().toUpperCase().split(/\s+/).filter(Boolean);
    const output: string[] = [];
    let current = '';

    const flush = () => {
      if (current) {
        output.push(current);
        current = '';
      }
    };

    words.forEach((word) => {
      if (word.length > limit) {
        flush();
        for (let i = 0; i < word.length; i += limit) {
          output.push(word.slice(i, i + limit));
        }
        return;
      }

      const next = current ? `${current} ${word}` : word;
      if (next.length > limit && current) {
        output.push(current);
        current = word;
      } else {
        current = next;
      }
    });

    flush();
    return output;
  });
}

function pointsString(points: Array<{ x: number; y: number }>) {
  return points.map((point) => `${point.x},${point.y}`).join(' ');
}

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

function computeIconScale(
  blockWidth: number,
  needsRing: boolean,
  letterBoost: number,
): number {
  if (needsRing) {
    const ringRadius = blockWidth / 2;
    const innerDiameter = ringRadius * 2 * 0.84;
    return ((innerDiameter * 0.78) / 24) * letterBoost;
  }
  return ((blockWidth * 0.92) / 24) * letterBoost;
}

const CHAR_WIDTH_FACTOR = 0.56;

/**
 * Encaixa texto em maxWidthMm x maxHeightMm.
 * Prioriza largura; se a altura estourar, reduz a fonte.
 */
function fitText(
  message: string,
  preferredFontSize: number,
  maxWidthMm: number,
  maxHeightMm: number,
  minFontSize = 8,
): { lines: string[]; fontSize: number; lineHeight: number } {
  let fontSize = preferredFontSize;

  for (let i = 0; i < 16; i += 1) {
    const maxChars = Math.max(1, Math.floor(maxWidthMm / Math.max(1, fontSize * CHAR_WIDTH_FACTOR)));
    const lines = wrap(message, maxChars);
    const lineHeight = fontSize * 1.12;
    const longest = lines.reduce((max, line) => Math.max(max, line.length), 0);
    const width = longest * fontSize * CHAR_WIDTH_FACTOR;
    const height = lines.length * lineHeight;

    const widthOk = width <= maxWidthMm + 0.01;
    const heightOk = height <= maxHeightMm + 0.01;

    if ((widthOk && heightOk) || fontSize <= minFontSize) {
      return { lines, fontSize, lineHeight };
    }

    // Reduz pelo fator mais restritivo.
    const widthFactor = widthOk ? 1 : maxWidthMm / Math.max(1, width);
    const heightFactor = heightOk ? 1 : maxHeightMm / Math.max(1, height);
    fontSize = Math.max(minFontSize, fontSize * Math.min(widthFactor, heightFactor) * 0.97);
  }

  const maxChars = Math.max(1, Math.floor(maxWidthMm / Math.max(1, fontSize * CHAR_WIDTH_FACTOR)));
  const lines = wrap(message, maxChars);
  return { lines, fontSize, lineHeight: fontSize * 1.12 };
}

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
  const textGap = 8 * s;
  const position = appearance.pictogramPosition;
  const letterBoost = isLetterSlug(config.iconSlug) ? 1.6 : 1;
  const message = config.message || '';

  let finalLines: string[] = [];
  let finalFontSize = 12;
  let finalLineHeight = 14;
  let textX = cx;
  let textY = (contentTop + contentBottom) / 2;

  if (hasIcon && position === 'top') {
    // Pictograma com tamanho estável (~48% da menor dimensão útil),
    // independente do comprimento do texto.
    const pictSize = Math.min(usableWidth * 0.68, usableHeight * 0.48);
    const ringRadius = pictSize / 2;
    const iconScale = computeIconScale(pictSize, needsRing, letterBoost);

    // Texto usa a largura útil e a altura que sobra abaixo do pictograma.
    const textMaxWidth = usableWidth;
    const preferredFont = clamp(Math.min(pictSize * 1.08 * 0.26, usableWidth * 0.12), 12, 56);

    // Reserva altura para o pictograma + gap; o resto é do texto.
    // Se o texto precisar de mais linhas, ele encolhe — o pictograma NÃO.
    let textMaxHeight = Math.max(preferredFont * 1.12, usableHeight - pictSize - textGap);

    let fitted = fitText(message, preferredFont, textMaxWidth, textMaxHeight);

    // Se ainda sobrar espaço vertical generoso e o texto ficou pequeno demais,
    // permite um pouco mais de altura (já está ok).
    const textBlockH = fitted.lines.length * fitted.lineHeight;
    const totalBlockH = pictSize + textGap + textBlockH;

    // Centro vertical do bloco completo.
    const blockTop = contentTop + Math.max(0, (usableHeight - totalBlockH) / 2);
    const iconY = blockTop + pictSize / 2;
    textY = blockTop + pictSize + textGap + textBlockH / 2;
    textX = cx;

    finalLines = fitted.lines;
    finalFontSize = fitted.fontSize;
    finalLineHeight = fitted.lineHeight;

    elements.push(...iconElements(
      config.iconSvg,
      cx,
      iconY,
      iconScale,
      needsRing ? ringRadius : 0,
      appearance.circle,
      appearance.prohibition,
    ));
  } else if (hasIcon && (position === 'left' || position === 'right')) {
    // Laterais maiores: até ~50% da altura e ~38% da largura.
    const sideBlock = Math.min(
      usableHeight * 0.55,
      usableWidth * 0.38,
      Math.min(usableWidth, usableHeight) * 0.5,
    );
    const sideRingRadius = sideBlock / 2;
    const sideIconScale = computeIconScale(sideBlock, needsRing, letterBoost);

    const gap = 14 * s;
    const textAreaWidth = Math.max(30 * s, usableWidth - sideBlock - gap);
    const preferredFont = clamp(Math.min(textAreaWidth * 0.18, usableHeight * 0.16), 12, 48);

    const fitted = fitText(message, preferredFont, textAreaWidth, usableHeight);
    finalLines = fitted.lines;
    finalFontSize = fitted.fontSize;
    finalLineHeight = fitted.lineHeight;

    const textBlockH = finalLines.length * finalLineHeight;
    const pairH = Math.max(sideBlock, textBlockH);
    const pairTop = contentTop + Math.max(0, (usableHeight - pairH) / 2);
    const iconY = pairTop + pairH / 2;
    textY = pairTop + pairH / 2;

    if (position === 'left') {
      const iconX = margin + pad + sideRingRadius;
      textX = iconX + sideRingRadius + gap;
      elements.push(...iconElements(
        config.iconSvg,
        iconX,
        iconY,
        sideIconScale,
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
        sideIconScale,
        needsRing ? sideRingRadius : 0,
        appearance.circle,
        appearance.prohibition,
      ));
    }
  } else {
    // Só texto.
    const preferredFont = clamp(12 * s, 12, 56);
    const fitted = fitText(message, preferredFont, usableWidth, usableHeight);
    finalLines = fitted.lines;
    finalFontSize = fitted.fontSize;
    finalLineHeight = fitted.lineHeight;

    const textBlockH = finalLines.length * finalLineHeight;
    textX = cx;
    textY = contentTop + usableHeight / 2;
    // Garante centro mesmo com muitas linhas.
    void textBlockH;
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
