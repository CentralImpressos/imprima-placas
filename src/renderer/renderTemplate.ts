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

  // Traço mais grosso (~16% do raio), com piso mínimo legível.
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

export function renderTemplate(config: SignRenderConfig): string {
  const geometry = getFrameGeometry(config.frameType, config.widthMm, config.heightMm);
  const { width: w, height: h, centerX: cx } = geometry;
  const { frameType, appearance } = config;
  const frame = cmykToRgb(appearance.frameColor);
  const bg = cmykToRgb(appearance.backgroundColor);
  const s = scaleFor(w, h);

  // Margem externa (borda → moldura) um pouco maior;
  // respiro interno (moldura → conteúdo) menor.
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

  // Largura-alvo do bloco do pictograma (com ou sem anel).
  const targetBlockWidth = Math.min(usableWidth * 0.72, usableHeight * 0.55);
  const ringRadius = targetBlockWidth / 2;

  // Ícone maior dentro do anel (~78% do diâmetro interno).
  // Ainda com folga para não encostar no traço.
  // Letras (alpha-*) têm mais padding no glyph → boost ~30%.
  const innerDiameter = ringRadius * 2 * 0.84; // desconta traço mais grosso
  const letterBoost = isLetterSlug(config.iconSlug) ? 1.3 : 1;
  const iconScale = ((innerDiameter * 0.78) / 24) * letterBoost;

  // Texto: largura mínima = diâmetro externo do círculo.
  // font-size pensado para que ~8–9 chars (ex.: PROIBIDO) cubram essa largura.
  const textWidthTarget = targetBlockWidth;
  let finalLines = wrap(config.message || '', Math.max(4, Math.floor(textWidthTarget / Math.max(1, 5.0 * s))));
  let finalFontSize = clamp(textWidthTarget * 0.22, 11, 52);
  let finalLineHeight = finalFontSize * 1.12;
  let textX = cx;
  let textY = (contentTop + contentBottom) / 2;
  let finalRingRadius = ringRadius;
  let finalIconScale = iconScale;

  if (hasIcon && appearance.pictogramPosition === 'top') {
    let blockScale = 1;
    for (let iteration = 0; iteration < 3; iteration += 1) {
      const blockW = targetBlockWidth * blockScale;
      const scaledFont = Math.max(11, finalFontSize * blockScale);
      const scaledLineH = scaledFont * 1.12;
      const textH = finalLines.length * scaledLineH;
      const blockH = blockW + textGap * blockScale + textH;
      const next = Math.min(
        1,
        usableWidth / Math.max(1, blockW),
        usableHeight / Math.max(1, blockH),
      );
      blockScale = Math.min(blockScale, next);
    }

    finalRingRadius = ringRadius * blockScale;
    finalIconScale = iconScale * blockScale;
    finalFontSize = Math.max(11, finalFontSize * blockScale);
    finalLineHeight = finalFontSize * 1.12;

    // Largura do texto >= diâmetro externo do anel.
    const outerDiameter = finalRingRadius * 2;
    finalLines = wrap(
      config.message || '',
      Math.max(4, Math.floor(outerDiameter / Math.max(1, finalFontSize * 0.52))),
    );

    const finalBlockW = outerDiameter;
    const finalTextH = finalLines.length * finalLineHeight;
    const finalBlockH = finalBlockW + textGap * blockScale + finalTextH;
    const finalBlockTop = contentTop + Math.max(0, (usableHeight - finalBlockH) / 2);

    textX = cx;
    textY = finalBlockTop + finalBlockW + textGap * blockScale + finalTextH / 2;
    const iconY = finalBlockTop + finalBlockW / 2;

    elements.push(...iconElements(
      config.iconSvg,
      cx,
      iconY,
      finalIconScale,
      needsRing ? finalRingRadius : 0,
      appearance.circle,
      appearance.prohibition,
    ));
  } else if (hasIcon) {
    finalIconScale = iconScale;

    if (appearance.pictogramPosition === 'left') {
      const iconX = margin + pad + finalRingRadius;
      textX = iconX + finalRingRadius + 8 * s;
      textY = (contentTop + contentBottom) / 2;
      elements.push(...iconElements(
        config.iconSvg, iconX, textY, finalIconScale,
        needsRing ? finalRingRadius : 0,
        appearance.circle, appearance.prohibition,
      ));
      const maxTextWidth = Math.max(35 * s, usableWidth - finalRingRadius * 2 - 12 * s);
      finalLines = wrap(config.message || '', Math.max(4, Math.floor(maxTextWidth / Math.max(1, 5.5 * s))));
    } else if (appearance.pictogramPosition === 'right') {
      const iconX = w - margin - pad - finalRingRadius;
      textX = iconX - finalRingRadius - 8 * s;
      textY = (contentTop + contentBottom) / 2;
      elements.push(...iconElements(
        config.iconSvg, iconX, textY, finalIconScale,
        needsRing ? finalRingRadius : 0,
        appearance.circle, appearance.prohibition,
      ));
      const maxTextWidth = Math.max(35 * s, usableWidth - finalRingRadius * 2 - 12 * s);
      finalLines = wrap(config.message || '', Math.max(4, Math.floor(maxTextWidth / Math.max(1, 5.5 * s))));
    }
  } else {
    finalLines = wrap(config.message || '', Math.max(4, Math.floor(usableWidth / Math.max(1, 5.5 * s))));
    finalFontSize = clamp(12 * s, 11, 52);
    finalLineHeight = finalFontSize * 1.12;
  }

  const textAnchor = appearance.pictogramPosition === 'left'
    ? 'start'
    : appearance.pictogramPosition === 'right'
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
