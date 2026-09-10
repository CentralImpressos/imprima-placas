import type { Composition, GraphicElement } from '../composition';
import type { PlateFieldValues, PlateRenderGeometry, PlateSize, TemplateDefinition } from '../types';

export const PROIBIDO_FUMAR: TemplateDefinition = {
  id: 'proibido-fumar',
  name: 'Proibido Fumar',
  category: 'Proibição',
  description: 'Placa circular de proibição com pictograma de fumar e risco diagonal separado.',
  sizes: ['10x15', '15x21', '20x30', '30x40', '30x50', '40x60', '50x70', '60x80'],
  fields: [
    { id: 'heading', label: 'Título', type: 'text', placeholder: 'PROIBIDO' },
    { id: 'message', label: 'Mensagem', type: 'textarea', placeholder: 'FUMAR' },
    { id: 'icon', label: 'Pictograma', type: 'select', placeholder: 'mdi:smoking' },
    { id: 'showIcon', label: 'Mostrar pictograma', type: 'toggle' },
  ],
  render: (values: PlateFieldValues, size: PlateSize, geometry?: PlateRenderGeometry): Composition => {
    void geometry;

    const width = size.widthMm;
    const height = size.heightMm;
    const plateCenterX = width / 2;

    const outerMargin = 5;
    const outerBorderWidth = 2.5;
    const borderRadius = 5;

    const circleDiameter = Math.min(width * 0.66, height * 0.57);
    const circleRadius = circleDiameter / 2;
    const circleCenterX = plateCenterX;
    const baseCircleCenterY = height * 0.33;
    const contentOffsetY = 8;
    const circleCenterY = baseCircleCenterY + contentOffsetY;
    const circleStroke = 12;

    const slashStroke = circleStroke;
    const slashLength = 2 * Math.sqrt(circleRadius ** 2 - (slashStroke / 2) ** 2);
    const iconScale = (circleDiameter * 0.84) / 24;
    const labelFontSize = 30;
    const messageFontSize = 30;

    const headingText = (values.heading || 'PROIBIDO').toUpperCase();
    const messageText = (values.message || 'FUMAR').toUpperCase();

    const headingY = 194 + contentOffsetY;
    const messageY = 238 + contentOffsetY;

    const elements: GraphicElement[] = [
      {
        type: 'rect',
        x: 0,
        y: 0,
        width,
        height,
        fill: '#FFFFFF',
      },
      {
        type: 'rect',
        x: 0.25,
        y: 0.25,
        width: width - 0.5,
        height: height - 0.5,
        fill: 'none',
        stroke: '#D1D5DB',
        strokeWidth: 0.5,
      },
      {
        type: 'rect',
        x: outerMargin,
        y: outerMargin,
        width: width - outerMargin * 2,
        height: height - outerMargin * 2,
        fill: 'none',
        stroke: '#000000',
        strokeWidth: outerBorderWidth,
        rx: borderRadius,
        ry: borderRadius,
      },
      {
        type: 'circle',
        cx: circleCenterX,
        cy: circleCenterY,
        r: circleRadius,
        fill: 'none',
        stroke: '#B91C1C',
        strokeWidth: circleStroke,
      },
    ];

    if (values.showIcon && values.iconSvg) {
      elements.push({
        type: 'icon',
        x: circleCenterX,
        y: circleCenterY,
        scale: iconScale,
        color: '#4D4D4D',
        svg: values.iconSvg,
      });
    }

    elements.push({
      type: 'group',
      transform: `rotate(45 ${circleCenterX} ${circleCenterY})`,
      children: [
        {
          type: 'rect',
          x: circleCenterX - slashStroke / 2,
          y: circleCenterY - slashLength / 2,
          width: slashStroke,
          height: slashLength,
          fill: '#B91C1C',
        },
      ],
    });

    elements.push(
      {
        type: 'text',
        x: plateCenterX,
        y: headingY,
        text: headingText,
        fontSize: labelFontSize,
        fontWeight: 900,
        fill: '#000000',
        fontFamily: 'Arial, sans-serif',
        anchor: 'middle',
        dominantBaseline: 'middle',
        letterSpacing: 0,
      },
      {
        type: 'text',
        x: plateCenterX,
        y: messageY,
        text: messageText,
        fontSize: messageFontSize,
        fontWeight: 900,
        fill: '#000000',
        fontFamily: 'Arial, sans-serif',
        anchor: 'middle',
        dominantBaseline: 'middle',
        letterSpacing: 0,
      },
    );

    return {
      widthMm: width,
      heightMm: height,
      elements,
    };
  },
};
