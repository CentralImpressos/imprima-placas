import { normalizeLines } from '../utils/text';
import type { Composition, GraphicElement } from '../composition';
import type { PlateFieldValues, PlateGeometry, PlateSize, TemplateDefinition } from '../types';

export const AVISO_AZUL_01: TemplateDefinition = {
  id: 'aviso-azul-01',
  name: 'Aviso Azul 01',
  category: 'Avisos',
  description: 'Modelo base de aviso em fundo branco, borda azul e cabeçalho institucional.',
  fields: [
    { id: 'heading', label: 'Cabeçalho', type: 'text', placeholder: 'ATENÇÃO' },
    { id: 'message', label: 'Texto principal', type: 'textarea', placeholder: 'É PROIBIDA A ENTRADA DE ANIMAIS' },
    { id: 'icon', label: 'Pictograma', type: 'select', placeholder: 'mdi:alert' },
    { id: 'showIcon', label: 'Mostrar pictograma', type: 'toggle' }
  ],
  render: (values: PlateFieldValues, size: PlateSize, geometry?: PlateGeometry): Composition => {
    void geometry;

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

    const elements: GraphicElement[] = [
      { type: 'rect', x: 0, y: 0, width, height, fill: white },
      { type: 'rect', x: 10, y: 10, width: width - 20, height: height - 20, fill: 'none', stroke: borderColor, strokeWidth: 3 },
      { type: 'rect', x: 18, y: 18, width: width - 36, height: Math.max(34, height * 0.16), fill: headerFill },
      {
        type: 'text',
        x: width / 2,
        y: height * 0.125,
        text: heading,
        fontSize: Math.max(14, width * 0.08),
        fontWeight: 900,
        fill: white,
        fontFamily: 'Arial, sans-serif',
        anchor: 'middle',
        letterSpacing: 1.2,
      },
      { type: 'rect', x: 18, y: height * 0.27, width: width - 36, height: height * 0.62, fill: white },
    ];

    if (values.showIcon && values.iconSvg) {
      elements.push({
        type: 'icon',
        x: iconCenterX,
        y: iconCenterY,
        scale: iconScale,
        svg: values.iconSvg,
      });
    }

    safeLines.forEach((line, index) => {
      elements.push({
        type: 'text',
        x: textStartX,
        y: height * 0.48 + index * 22,
        text: line,
        fontSize: Math.max(11, width * 0.05),
        fontWeight: 700,
        fill: textDark,
        fontFamily: 'Arial, sans-serif',
        anchor: 'middle',
      });
    });

    return {
      widthMm: width,
      heightMm: height,
      elements,
    };
  }
};
