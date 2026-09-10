import { normalizeLines } from '../utils/text';
import type { PlateFieldValues, PlateSize, TemplateDefinition } from '../types';

export const AVISO_AZUL_01: TemplateDefinition = {
  id: 'aviso-azul-01',
  name: 'Aviso Azul 01',
  category: 'Avisos',
  description: 'Modelo base de aviso com borda externa, filete interno e cabeçalho azul.',
  sizes: ['10x15', '15x21', '20x30', '30x40', '30x50', '40x60', '50x70', '60x80'],
  fields: [
    { id: 'heading', label: 'Cabeçalho', type: 'text', placeholder: 'ATENÇÃO' },
    { id: 'message', label: 'Texto principal', type: 'textarea', placeholder: 'PROIBIDO ESTACIONAR' },
    { id: 'icon', label: 'Pictograma', type: 'select', placeholder: 'mdi:alert' },
    { id: 'showIcon', label: 'Mostrar pictograma', type: 'toggle' }
  ],
  render: (values: PlateFieldValues, size: PlateSize) => {
    const width = size.widthMm;
    const height = size.heightMm;
    const heading = (values.heading || 'ATENÇÃO').toUpperCase();
    const lines = normalizeLines(values.message || 'TEXTO PRINCIPAL', 3);
    const bodyText = lines.length ? lines : ['TEXTO PRINCIPAL'];
    const bg = '#1E3A8A';
    const fg = '#FFFFFF';
    const bodyBg = '#F8FAFC';
    const bodyTextColor = '#1F2937';
    const iconAreaX = width * 0.26;
    const textStartX = values.showIcon ? width * 0.58 : width / 2;

    const linesMarkup = bodyText
      .map((line, index) => {
        const y = height * 0.53 + index * 18;
        return `<text x="${textStartX}" y="${y}" text-anchor="middle" font-size="${Math.max(8, width * 0.04)}" font-weight="700" fill="${bodyTextColor}" font-family="Arial, sans-serif">${line}</text>`;
      })
      .join('');

    const iconMarkup = values.showIcon
      ? `
        <g transform="translate(${iconAreaX} ${height * 0.52})">
          <circle cx="0" cy="0" r="${Math.min(width, height) * 0.09}" fill="rgba(30,58,138,0.08)" stroke="${bodyTextColor}" stroke-width="2"/>
          <circle cx="0" cy="0" r="${Math.min(width, height) * 0.05}" fill="none" stroke="${bodyTextColor}" stroke-width="2"/>
          <path d="M0 -18 L12 0 L0 18 L-12 0 Z" fill="none" stroke="${bodyTextColor}" stroke-width="2"/>
        </g>
      `
      : '';

    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}mm" height="${height}mm" viewBox="0 0 ${width} ${height}" role="img" aria-label="Placa de aviso">
        <rect width="${width}" height="${height}" rx="8" fill="${bg}"/>
        <rect x="8" y="8" width="${width - 16}" height="${height - 16}" rx="4" fill="none" stroke="${fg}" stroke-width="2"/>
        <rect x="16" y="16" width="${width - 32}" height="${Math.max(24, height * 0.18)}" rx="4" fill="${fg}"/>
        <text x="${width / 2}" y="${height * 0.14}" text-anchor="middle" font-size="${Math.max(15, width * 0.09)}" font-weight="900" fill="${bg}" font-family="Arial, sans-serif" letter-spacing="1">${heading}</text>
        <line x1="20" y1="${height * 0.23}" x2="${width - 20}" y2="${height * 0.23}" stroke="${fg}" stroke-width="2" />
        <rect x="22" y="${height * 0.28}" width="${width - 44}" height="${height * 0.56}" rx="6" fill="${bodyBg}"/>
        ${iconMarkup}
        <g font-family="Arial, sans-serif">
          ${linesMarkup}
        </g>
      </svg>
    `;
  }
};
