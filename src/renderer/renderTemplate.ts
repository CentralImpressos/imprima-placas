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

function computeIconScale(blockWidth: number, needsRing: boolean, letterBoost: number): number {
  if (needsRing) {
    const ringRadius = blockWidth / 2;
    const innerDiameter = ringRadius * 2 * 0.84;
    return ((innerDiameter * 0.78) / 24) * letterBoost;
  }
  return ((blockWidth * 0.92) / 24) * letterBoost;
}

const CHAR_WIDTH_FACTOR = 0.56;

function fitText(
  message: string,
  preferredFontSize: number,
  maxWidthMm: number,
  maxHeightMm: number,
  minFontSize = 9,
): { lines: string[]; fontSize: number; lineHeight: number } {
  let fontSize = preferredFontSize;

  for (let i = 0; i < 16; i += 1) {
    const maxChars = Math.max(1, Math.floor(maxWidthMm / Math.max(1, fontSize * CHAR_WIDTH_FACTOR)));
    const lines = wrap(message, maxChars);
    const lineHeight = fontSize * 1.12;
    const longest = lines.reduce((max, line) => Math.max(max, line.length), 0);
    const width = longest * fontSize * CHAR_WIDTH_FACTOR;
    const height = Math.max(lineHeight, lines.length * lineHeight);

    const widthOk = width <= maxWidthMm + 0.01;
    const heightOk = height <= maxHeightMm + 0.01;

    if ((widthOk && heightOk) || fontSize <= minFontSize) {
      return { lines, fontSize, lineHeight };
    }

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
  const contentMidY = contentTop + usableHeight / 2;

  const needsRing = appearance.circle || appearance.prohibition;
  const position = appearance.pictogramPosition;
  const letterBoost = isLetterSlug(config.iconSlug) ? 1.6 : 1;
  const message = config.message || '';

  let finalLines: string[] = [];
  let finalFontSize = 12;
  let finalLineHeight = 14;
  let textX = cx;
  let textY = contentMidY;

  if (hasIcon && position === 'top') {
    // --- Grupo vertical: pictograma + gap + texto ---
    // Tamanhos preferidos generosos; o grupo inteiro só encolhe se não couber.
    const preferredPict = Math.min(usableWidth * 0.7, usableHeight * 0.52);
    const minPict = Math.min(usableWidth * 0.35, usableHeight * 0.22);
    const gap = 8 * s;

    // Texto: prefere largura ~ diâmetro do pictograma (um pouco maior).
    const preferredTextWidth = Math.min(usableWidth, preferredPict * 1.12);
    const preferredFont = clamp(preferredTextWidth * 0.28, 14, 58);

    // 1) Tenta com pictograma preferido e texto cabendo no que sobra.
    let pictSize = preferredPict;
    let textMaxH = Math.max(preferredFont * 1.2, usableHeight - pictSize - gap);
    let fitted = fitText(message, preferredFont, preferredTextWidth, textMaxH);

    // 2) Se o bloco ainda estoura a altura, reduz o texto primeiro;
    //    se ainda não couber, aí sim reduz o pictograma.
    let textH = fitted.lines.length * fitted.lineHeight;
    let blockH = pictSize + gap + textH;

    if (blockH > usableHeight) {
      // Comprime texto mantendo pictograma.
      textMaxH = Math.max(preferredFont * 0.9, usableHeight - pictSize - gap);
      fitted = fitText(message, preferredFont, preferredTextWidth, textMaxH);
      textH = fitted.lines.length * fitted.lineHeight;
      blockH = pictSize + gap + textH;
    }

    if (blockH > usableHeight && pictSize > minPict) {
      // Ainda não cabe: reduz pictograma o mínimo necessário.
      const availableForPict = usableHeight - textH - gap;
      pictSize = clamp(availableForPict, minPict, preferredPict);
      // Re-fit texto com a nova altura restante (pode ganhar um pouco de fonte).
      textMaxH = Math.max(9 * 1.12, usableHeight - pictSize - gap);
      fitted = fitText(message, preferredFont, Math.min(usableWidth, pictSize * 1.12), textMaxH);
      textH = fitted.lines.length * fitted.lineHeight;
      blockH = pictSize + gap + textH;
    }

    // 3) Se ainda sobrar overflow (caso extremo), escala o grupo inteiro.
    let groupScale = 1;
    if (blockH > usableHeight) {
      groupScale = usableHeight / blockH;
      pictSize *= groupScale;
      fitted = {
        lines: fitted.lines,
        fontSize: Math.max(8, fitted.fontSize * groupScale),
        lineHeight: Math.max(9, fitted.lineHeight * groupScale),
      };
      textH = fitted.lines.length * fitted.lineHeight;
      blockH = pictSize + gap * groupScale + textH;
    }

    // Largura do grupo = max(pict, texto estimado).
    const textWidthEst = fitted.lines.reduce((max, line) => Math.max(max, line.length), 0) * fitted.fontSize * CHAR_WIDTH_FACTOR;
    const blockW = Math.max(pictSize, Math.min(usableWidth, textWidthEst));

    // Centro do grupo na área útil.
    const blockTop = contentTop + Math.max(0, (usableHeight - blockH) / 2);
    const blockLeft = cx - blockW / 2; // só referência; texto/pict ficam centrados em cx
    void blockLeft;

    const iconY = blockTop + pictSize / 2;
    textY = blockTop + pictSize + gap * groupScale + textH / 2;
    textX = cx;

    finalLines = fitted.lines;
    finalFontSize = fitted.fontSize;
    finalLineHeight = fitted.lineHeight;

    const ringRadius = pictSize / 2;
    const iconScale = computeIconScale(pictSize, needsRing, letterBoost);

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
    // --- Grupo horizontal: pictograma | gap | texto ---
    const preferredPict = Math.min(usableHeight * 0.62, usableWidth * 0.4);
    const minPict = Math.min(usableHeight * 0.28, usableWidth * 0.18);
    const gap = 14 * s;

    let pictSize = preferredPict;
    let textAreaW = Math.max(30 * s, usableWidth - pictSize - gap);
    const preferredFont = clamp(Math.min(textAreaW * 0.2, usableHeight * 0.18), 14, 50);

    let fitted = fitText(message, preferredFont, textAreaW, usableHeight);
    let textH = fitted.lines.length * fitted.lineHeight;
    let blockW = pictSize + gap + Math.min(textAreaW, fitted.lines.reduce((m, l) => Math.max(m, l.length), 0) * fitted.fontSize * CHAR_WIDTH_FACTOR);
    let blockH = Math.max(pictSize, textH);

    // Se largura estoura, reduz pictograma um pouco e refaz texto.
    if (blockW > usableWidth && pictSize > minPict) {
      const textNeed = Math.min(textAreaW, fitted.lines.reduce((m, l) => Math.max(m, l.length), 1) * fitted.fontSize * CHAR_WIDTH_FACTOR);
      pictSize = clamp(usableWidth - gap - textNeed, minPict, preferredPict);
      textAreaW = Math.max(30 * s, usableWidth - pictSize - gap);
      fitted = fitText(message, preferredFont, textAreaW, usableHeight);
      textH = fitted.lines.length * fitted.lineHeight;
      blockW = pictSize + gap + Math.min(textAreaW, fitted.lines.reduce((m, l) => Math.max(m, l.length), 0) * fitted.fontSize * CHAR_WIDTH_FACTOR);
      blockH = Math.max(pictSize, textH);
    }

    // Escala o grupo se ainda não couber.
    let groupScale = 1;
    if (blockW > usableWidth || blockH > usableHeight) {
      groupScale = Math.min(usableWidth / Math.max(1, blockW), usableHeight / Math.max(1, blockH));
      pictSize *= groupScale;
      fitted = {
        lines: fitted.lines,
        fontSize: Math.max(8, fitted.fontSize * groupScale),
        lineHeight: Math.max(9, fitted.lineHeight * groupScale),
      };
      textH = fitted.lines.length * fitted.lineHeight;
      blockH = Math.max(pictSize, textH);
      blockW = pictSize + gap * groupScale + Math.min(
        textAreaW * groupScale,
        fitted.lines.reduce((m, l) => Math.max(m, l.length), 0) * fitted.fontSize * CHAR_WIDTH_FACTOR,
      );
    }

    const blockTop = contentTop + Math.max(0, (usableHeight - blockH) / 2);
    const blockLeft = (w - blockW) / 2; // centro horizontal do grupo
    const iconY = blockTop + blockH / 2;
    textY = blockTop + blockH / 2;

    finalLines = fitted.lines;
    finalFontSize = fitted.fontSize;
    finalLineHeight = fitted.lineHeight;

    const ringRadius = pictSize / 2;
    const iconScale = computeIconScale(pictSize, needsRing, letterBoost);
    const effectiveGap = gap * groupScale;

    if (position === 'left') {
      const iconX = blockLeft + ringRadius;
      textX = iconX + ringRadius + effectiveGap;
      elements.push(...iconElements(
        config.iconSvg,
        iconX,
        iconY,
        iconScale,
        needsRing ? ringRadius : 0,
        appearance.circle,
        appearance.prohibition,
      ));
    } else {
      const iconX = blockLeft + blockW - ringRadius;
      textX = iconX - ringRadius - effectiveGap;
      elements.push(...iconElements(
        config.iconSvg,
        iconX,
        iconY,
        iconScale,
        needsRing ? ringRadius : 0,
        appearance.circle,
        appearance.prohibition,
      ));
    }
  } else {
    // Só texto — também centrado como bloco.
    const preferredFont = clamp(Math.min(usableWidth * 0.14, usableHeight * 0.14), 14, 56);
    const fitted = fitText(message, preferredFont, usableWidth, usableHeight);
    finalLines = fitted.lines;
    finalFontSize = fitted.fontSize;
    finalLineHeight = fitted.lineHeight;

    const textH = finalLines.length * finalLineHeight;
    textX = cx;
    textY = contentTop + Math.max(0, (usableHeight - textH) / 2) + textH / 2;
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
