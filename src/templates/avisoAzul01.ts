import { normalizeLines } from '../utils/text';
import type { PlateFieldValues, PlateSize, TemplateDefinition } from '../types';

export const AVISO_AZUL_01: TemplateDefinition = {
  id: 'aviso-azul-01',
  name: 'Aviso Azul 01',
  category: 'Avisos',
  description: 'Modelo base de aviso em fundo branco, borda azul e cabeçalho institucional.',
  sizes: ['10x15', '15x21', '20x30', '30x40', '30x50', '40x60', '50x70', '60x80'],
  fields: [
    { id: 'heading', label: 'Cabeçalho', type: 'text', placeholder: 'ATENÇÃO' },
    { id: 'message', label: 'Texto principal', type: 'textarea', placeholder: 'É PROIBIDA A ENTRADA DE ANIMAIS' },
    { id: 'icon', label: 'Pictograma', type: 'select', placeholder: 'mdi:alert' },
    { id: 'showIcon', label: 'Mostrar pictograma', type: 'toggle' }
  ],
  render: (values: PlateFieldValues, size: PlateSize) => {
    const width = size.widthMm;
    const height = size.heightMm;
    const heading = (values.heading || 'AVISO').toUpperCase();
    const lineLimit = Math.max(2, Math.min(3, Math.round(width / 75)));
    const bodyText = normalizeLines(values.message || 'É PROIBIDA A ENTRADA DE ANIMAIS', lineLimit, Math.max(18, Math.round(width / 10)));
    const safeLines = bodyText.length ? bodyText : ['É PROIBIDA A ENTRADA'];
    const borderColor = '#0F3D9A';
    const headerFill = '#0F3D9A';
    const white = '#FFFFFF';
    const textDark = '#111827';
    const textStartX = values.showIcon ? width * 0.52 : width / 2;
    const iconCenterX = width * 0.24;
    const iconCenterY = height * 0.57;
    const iconScale = Math.min(width, height) / 150;

    const linesMarkup = safeLines
      .map((line, index) => {
        const y = height * 0.48 + index * 22;
        return `<text x="${textStartX}" y="${y}" text-anchor="middle" font-size="${Math.max(11, width * 0.05)}" font-weight="700" fill="${textDark}" font-family="Arial, sans-serif">${line}</text>`;
      })
      .join('');

    const iconMarkup = values.showIcon && values.iconSvg
      ? `<g transform="translate(${iconCenterX} ${iconCenterY}) scale(${iconScale})">${values.iconSvg}</g>`
      : '';

    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}mm" height="${height}mm" viewBox="0 0 ${width} ${height}" role="img" aria-label="Placa de aviso">
        <rect x="0" y="0" width="${width}" height="${height}" fill="${white}"/>
        <rect x="10" y="10" width="${width - 20}" height="${height - 20}" fill="none" stroke="${borderColor}" stroke-width="3"/>
        <rect x="18" y="18" width="${width - 36}" height="${Math.max(34, height * 0.16)}" fill="${headerFill}"/>
        <text x="${width / 2}" y="${height * 0.125}" text-anchor="middle" font-size="${Math.max(14, width * 0.08)}" font-weight="900" fill="${white}" font-family="Arial, sans-serif" letter-spacing="1.2">${heading}</text>
        <rect x="18" y="${height * 0.27}" width="${width - 36}" height="${height * 0.62}" fill="${white}"/>
        ${iconMarkup}
        <g font-family="Arial, sans-serif">
          ${linesMarkup}
        </g>
      </svg>
    `;
  }
};
