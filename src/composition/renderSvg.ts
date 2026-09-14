import type { Composition, GraphicElement } from './types';

function escapeXml(value: string): string { return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;'); }

function renderGraphicElement(element: GraphicElement): string {
  switch (element.type) {
    case 'rect': return `<rect x="${element.x}" y="${element.y}" width="${element.width}" height="${element.height}" fill="${element.fill ?? 'none'}" stroke="${element.stroke ?? 'none'}" stroke-width="${element.strokeWidth ?? 0}"${element.rx !== undefined ? ` rx="${element.rx}"` : ''}${element.ry !== undefined ? ` ry="${element.ry}"` : ''}/>`;
    case 'circle': return `<circle cx="${element.cx}" cy="${element.cy}" r="${element.r}" fill="${element.fill ?? 'none'}" stroke="${element.stroke ?? 'none'}" stroke-width="${element.strokeWidth ?? 0}"/>`;
    case 'polygon': return `<polygon points="${element.points}" fill="${element.fill ?? 'none'}" stroke="${element.stroke ?? 'none'}" stroke-width="${element.strokeWidth ?? 0}"${element.strokeLinejoin ? ` stroke-linejoin="${element.strokeLinejoin}"` : ''}/>`;
    case 'text': return `<text x="${element.x}" y="${element.y}" font-size="${element.fontSize}" font-family="${element.fontFamily ?? 'sans-serif'}" font-weight="${element.fontWeight ?? 400}" fill="${element.fill ?? '#000'}" text-anchor="${element.anchor ?? 'start'}" dominant-baseline="${element.dominantBaseline ?? 'alphabetic'}"${element.letterSpacing !== undefined ? ` letter-spacing="${element.letterSpacing}"` : ''}>${escapeXml(element.text)}</text>`;
    case 'icon': { const scale = element.scale ?? 1; return `<g transform="translate(${element.x} ${element.y}) scale(${scale}) translate(-12 -12)" color="${element.color ?? '#000'}">${element.svg}</g>`; }
    case 'group': return `<g${element.transform ? ` transform="${element.transform}"` : ''}>${element.children.map(renderGraphicElement).join('')}</g>`;
    default: return '';
  }
}

export function renderCompositionToSvg(composition: Composition): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${composition.widthMm}mm" height="${composition.heightMm}mm" viewBox="0 0 ${composition.widthMm} ${composition.heightMm}" role="img" aria-label="Placa de sinalização">${composition.elements.map(renderGraphicElement).join('')}</svg>`;
}
