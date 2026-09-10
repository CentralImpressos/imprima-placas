import type { Composition, GraphicElement } from './types';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function renderGraphicElement(element: GraphicElement): string {
  switch (element.type) {
    case 'rect': {
      const fill = element.fill ? ` fill="${element.fill}"` : '';
      const stroke = element.stroke ? ` stroke="${element.stroke}"` : '';
      const strokeWidth = element.strokeWidth !== undefined ? ` stroke-width="${element.strokeWidth}"` : '';
      const rx = element.rx !== undefined ? ` rx="${element.rx}"` : '';
      const ry = element.ry !== undefined ? ` ry="${element.ry}"` : '';
      return `<rect x="${element.x}" y="${element.y}" width="${element.width}" height="${element.height}"${fill}${stroke}${strokeWidth}${rx}${ry}/>`;
    }
    case 'circle': {
      const fill = element.fill ? ` fill="${element.fill}"` : '';
      const stroke = element.stroke ? ` stroke="${element.stroke}"` : '';
      const strokeWidth = element.strokeWidth !== undefined ? ` stroke-width="${element.strokeWidth}"` : '';
      return `<circle cx="${element.cx}" cy="${element.cy}" r="${element.r}"${fill}${stroke}${strokeWidth}/>`;
    }
    case 'text': {
      const fontFamily = element.fontFamily ? ` font-family="${element.fontFamily}"` : '';
      const fontWeight = element.fontWeight !== undefined ? ` font-weight="${element.fontWeight}"` : '';
      const fill = element.fill ? ` fill="${element.fill}"` : '';
      const anchor = element.anchor ? ` text-anchor="${element.anchor}"` : '';
      const dominantBaseline = element.dominantBaseline ? ` dominant-baseline="${element.dominantBaseline}"` : '';
      const letterSpacing = element.letterSpacing !== undefined ? ` letter-spacing="${element.letterSpacing}"` : '';
      return `<text x="${element.x}" y="${element.y}" font-size="${element.fontSize}"${fontFamily}${fontWeight}${fill}${anchor}${dominantBaseline}${letterSpacing}>${escapeXml(element.text)}</text>`;
    }
    case 'icon': {
      const scale = element.scale ?? 1;
      const color = element.color ? ` color="${element.color}"` : '';
      const transform = `translate(${element.x} ${element.y}) scale(${scale}) translate(-12 -12)`;
      return `<g transform="${transform}"${color}>${element.svg}</g>`;
    }
    case 'group': {
      const transform = element.transform ? ` transform="${element.transform}"` : '';
      const children = element.children.map(renderGraphicElement).join('');
      return `<g${transform}>${children}</g>`;
    }
    default:
      return '';
  }
}

export function renderCompositionToSvg(composition: Composition): string {
  const { widthMm, heightMm, elements } = composition;
  const body = elements.map(renderGraphicElement).join('');

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${widthMm}mm" height="${heightMm}mm" viewBox="0 0 ${widthMm} ${heightMm}" role="img" aria-label="Placa de aviso">
      ${body}
    </svg>
  `;
}
