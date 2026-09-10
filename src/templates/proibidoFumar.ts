import type { Composition, GraphicElement } from '../composition';
import type { PlateFieldValues, PlateRenderGeometry, PlateSize, TemplateDefinition } from '../types';

export const PROIBIDO_FUMAR: TemplateDefinition = {
  id: 'proibido-fumar',
  name: 'Proibido Fumar',
  category: 'Proibição',
  description: 'Placa circular de proibição com pictograma de fumar e risco diagonal separado.',
  sizes: ['10x15', '15x21', '20x30', '30x40', '30x50', '40x60', '50x70', '60x80'],
  fields: [
    { id: 'message', label: 'Texto da placa', type: 'textarea', placeholder: 'PROIBIDO\nFUMAR' },
    { id: 'icon', label: 'Pictograma', type: 'select', placeholder: 'mdi:smoking' },
    { id: 'showIcon', label: 'Mostrar pictograma', type: 'toggle' },
  ],
  render: (values: PlateFieldValues, size: PlateSize, geometry?: PlateRenderGeometry): Composition => {
    void geometry;

    const width = size.widthMm;
    const height = size.heightMm;
    const plateCenterX = width / 2;
    const BASE_WIDTH = 200;
    const BASE_CIRCLE_RADIUS = 66;
    const BASE_CIRCLE_STROKE = 12;
    const BASE_ICON_SCALE = 4.62;
    const BASE_FONT_SIZE = 30;
    const BASE_CIRCLE_CENTER_Y = 107;
    const BASE_TEXT_CENTER_Y = 224;
    const BASE_TEXT_LINE_HEIGHT = 28;

    const scale = width / BASE_WIDTH;

    const outerMargin = 5;
    const outerBorderWidth = 2.5;
    const borderRadius = 5;

    const circleRadius = BASE_CIRCLE_RADIUS * scale;
    const circleCenterX = plateCenterX;
    const circleStroke = BASE_CIRCLE_STROKE * scale;
    const slashStroke = circleStroke;
    const slashLength = 2 * Math.sqrt(circleRadius ** 2 - (slashStroke / 2) ** 2);
    const iconScale = BASE_ICON_SCALE * scale;
    const fontSize = BASE_FONT_SIZE * scale;
    const lineHeight = BASE_TEXT_LINE_HEIGHT * scale;

    const circleCenterYLocal = 0;
    const textCenterYLocal = (BASE_TEXT_CENTER_Y - BASE_CIRCLE_CENTER_Y) * scale;
    const rawText = values.message?.trim() || [values.heading, 'FUMAR'].filter(Boolean).join('\n');
    const textLines = rawText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.toUpperCase());
    const safeLines = textLines.length > 0 ? textLines : ['PROIBIDO', 'FUMAR'];
    const textBlockHeight = safeLines.length * lineHeight;
    const textTop = textCenterYLocal - textBlockHeight / 2;
    const textBottom = textCenterYLocal + textBlockHeight / 2;

    const blockTop = Math.min(
      circleCenterYLocal - circleRadius - circleStroke / 2,
      textTop,
    );
    const blockBottom = Math.max(
      circleCenterYLocal + circleRadius + circleStroke / 2,
      textBottom,
    );
    const blockHeight = blockBottom - blockTop;
    const plateCenterY = height / 2;
    const blockOffsetY = plateCenterY - (blockTop + blockHeight / 2);

    const circleCenterY = circleCenterYLocal + blockOffsetY;
    const textCenterY = textCenterYLocal + blockOffsetY;

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
        color: '#000000',
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

    safeLines.forEach((line, index) => {
      const y = textCenterY + (index - (safeLines.length - 1) / 2) * lineHeight;
      elements.push({
        type: 'text',
        x: plateCenterX,
        y,
        text: line,
        fontSize,
        fontWeight: 800,
        fill: '#000000',
        fontFamily: 'Barlow Semi Condensed, sans-serif',
        anchor: 'middle',
        dominantBaseline: 'middle',
        letterSpacing: 0,
      });
    });

    return {
      widthMm: width,
      heightMm: height,
      elements,
    };
  },
};
