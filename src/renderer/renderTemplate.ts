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
      // Parte palavra que sozinha já excede o limite.
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

/**
 * Escala do pictograma (viewBox 24x24).
 * Com anel: ~78% do diâmetro interno.
 * Sem anel: ~92% do bloco de referência (maior).
 * Letras alpha-* recebem boost extra (glyph com muito padding).
 */
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
 * Reduz font-size até a linha mais longa caber em maxWidthMm.
 * Também re-quebra o texto com o novo tamanho se necessário.
 */
function fitTextToWidth(
  message: string,
  preferredFontSize: number,
  maxWidthMm: number,
  minFontSize = 8,
): { lines: string[]; fontSize: number; lineHeight: number } {
  let fontSize = preferredFontSize;
  let lines = wrap(message, Math.max(1, Math.floor(maxWidthMm / Math.max(1, fontSize * CHAR_WIDTH_FACTOR))));

  for (let i = 0; i < 12; i += 1) {
    const longest = lines.reduce((max, line) => Math.max(max, line.length), 0);
    const estimatedWidth = longest * fontSize * CHAR_WIDTH_FACTOR;
    if (estimatedWidth <= maxWidthMm || fontSize <= minFontSize) {
      break;
    }
    fontSize = Math.max(minFontSize, fontSize * (maxWidthMm / Math.max(1, estimatedWidth)) * 0.98);
    lines = wrap(message, Math.max(1, Math.floor(maxWidthMm / Math.max(1, fontSize * CHAR_WIDTH_FACTOR))));
  }

  // Última garantia: se ainda sobrar linha longa (palavra gigante), força o font-size.
  const longest = lines.reduce((max, line) => Math.max(max, line.length), 1);
  const finalWidth = longest * fontSize * CHAR_WIDTH_FACTOR;
  if (finalWidth > maxWidthMm) {
    fontSize = Math.max(minFontSize, maxWidthMm / (longest * CHAR_WIDTH_FACTOR));
  }

  return {
    lines,
    fontSize,
    lineHeight: fontSize * 1.12,
  };
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
  // Largura máxima segura para o texto (nunca ultrapassar a moldura).
  const usableWidth = isNonRectangular
    ? Math.min(w, h) - 2 * (margin + pad)
    : w - 2 * (margin + stroke + pad);
  const usableHeight = Math.max(1, contentBottom - contentTop);

  const needsRing = appearance.circle || appearance.prohibition;
  const textGap = 6 * s;
  const position = appearance.pictogramPosition;
  const letterBoost = isLetterSlug(config.iconSlug) ? 1.6 : 1;
  const message = config.message || '';

  const targetBlockWidth = Math.min(usableWidth * 0.72, usableHeight * 0.55);
  const ringRadius = targetBlockWidth / 2;
  const iconScale = computeIconScale(targetBlockWidth, needsRing, letterBoost);

  // Preferência de largura do texto (um pouco maior que o anel), mas nunca acima de usableWidth.
  const preferredTextWidth = Math.min(usableWidth, targetBlockWidth * 1.08);
  let fitted = fitTextToWidth(message, clamp(preferredTextWidth * 0.26, 12, 56), preferredTextWidth);
  let finalLines = fitted.lines;
  let finalFontSize = fitted.fontSize;
  let finalLineHeight = fitted.lineHeight;
  let textX = cx;
  let textY = (contentTop + contentBottom) / 2;
  let finalRingRadius = ringRadius;
  let finalIconScale = iconScale;

  if (hasIcon && position === 'top') {
    let blockScale = 1;
    for (let iteration = 0; iteration < 3; iteration += 1) {
      const pictW = targetBlockWidth * blockScale;
      const textH = finalLines.length * finalLineHeight * blockScale;
      // Largura do bloco considera texto já limitado a usableWidth.
      const blockW = Math.max(pictW, Math.min(usableWidth, preferredTextWidth * blockScale));
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

    const outerDiameter = finalRingRadius * 2;
    // Texto: prefere ~diâmetro do anel, mas nunca passa de usableWidth.
    const textMaxWidth = Math.min(usableWidth, Math.max(outerDiameter * 1.08, outerDiameter));
    fitted = fitTextToWidth(
      message,
      Math.max(12, clamp(textMaxWidth * 0.26, 12, 56) * blockScale),
      textMaxWidth,
    );
    finalLines = fitted.lines;
    finalFontSize = fitted.fontSize;
    finalLineHeight = fitted.lineHeight;

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
    const sideBlock = Math.min(
      usableHeight * 0.42,
      usableWidth * 0.32,
      targetBlockWidth,
    );
    const sideRingRadius = sideBlock / 2;
    const sideIconScale = computeIconScale(sideBlock, needsRing, letterBoost);
    finalRingRadius = sideRingRadius;
    finalIconScale = sideIconScale;

    const gap = 12 * s;
    const pictBlock = sideBlock;
    const textAreaWidth = Math.max(24 * s, Math.min(usableWidth - pictBlock - gap, usableWidth * 0.55));

    fitted = fitTextToWidth(
      message,
      clamp(Math.min(textAreaWidth * 0.15, usableHeight * 0.14), 11, 44),
      textAreaWidth,
    );
    finalLines = fitted.lines;
    finalFontSize = fitted.fontSize;
    finalLineHeight = fitted.lineHeight;

    const contentMidY = (contentTop + contentBottom) / 2;
    const iconY = contentMidY;
    textY = contentMidY;

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
    fitted = fitTextToWidth(message, clamp(12 * s, 12, 56), usableWidth);
    finalLines = fitted.lines;
    finalFontSize = fitted.fontSize;
    finalLineHeight = fitted.lineHeight;
    textX = cx;
    textY = (contentTop + contentBottom) / 2;
  }

  // Segurança final: nunca deixar texto mais largo que usableWidth.
  fitted = fitTextToWidth(message, finalFontSize, usableWidth);
  finalLines = fitted.lines;
  finalFontSize = fitted.fontSize;
  finalLineHeight = fitted.lineHeight;

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
