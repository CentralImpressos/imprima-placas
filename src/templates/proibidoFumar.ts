import type { Composition, GraphicElement } from '../composition';
import type { PlateFieldValues, PlateGeometry, PlateSize, TemplateDefinition } from '../types';

export const PROIBIDO_FUMAR: TemplateDefinition = {
  id: 'proibido-fumar',
  name: 'Proibido Fumar',
  category: 'Proibição',
  description: 'Placa circular de proibição com pictograma de fumar e risco diagonal separado.',
  fields: [
    { id: 'message', label: 'Texto da placa', type: 'textarea', placeholder: 'PROIBIDO\nFUMAR' },
    { id: 'icon', label: 'Pictograma', type: 'select', placeholder: 'mdi:smoking' },
    { id: 'showIcon', label: 'Mostrar pictograma', type: 'toggle' },
  ],
  render: (values: PlateFieldValues, size: PlateSize, geometry?: PlateGeometry): Composition => {
    const width = geometry?.width ?? size.widthMm;
    const height = geometry?.height ?? size.heightMm;
    const plateCenterX = width / 2;

    // A moldura define uma área segura. Todo o conteúdo (símbolo + texto)
    // é tratado como um único bloco e nunca pode ultrapassar essa área.
    const outerMargin = Math.max(4, Math.min(5, width * 0.025));
    const outerBorderWidth = Math.max(2, Math.min(2.5, width * 0.0125));
    const borderRadius = Math.max(4, Math.min(5, width * 0.025));

    const innerLeft = outerMargin + outerBorderWidth;
    const innerRight = width - outerMargin - outerBorderWidth;
    const innerTop = outerMargin + outerBorderWidth;
    const innerBottom = height - outerMargin - outerBorderWidth;
    const innerWidth = Math.max(1, innerRight - innerLeft);
    const innerHeight = Math.max(1, innerBottom - innerTop);

    // Respiro mínimo entre a moldura e qualquer elemento do conteúdo.
    // O bloco usa uma margem interna proporcional, mas nunca excessiva.
    const safePadding = Math.max(7, Math.min(10, Math.min(width, height) * 0.045));
    const safeWidth = Math.max(1, innerWidth - safePadding * 2);
    const safeHeight = Math.max(1, innerHeight - safePadding * 2);

    const BASE_CIRCLE_RADIUS = 66;
    const BASE_CIRCLE_STROKE = 12;
    const BASE_ICON_SCALE = 4.62;
    const BASE_FONT_SIZE = 30;
    const BASE_LINE_HEIGHT = 31.2;
    const BASE_CONTENT_GAP = 14;
    const BASE_GLYPH_WIDTH_FACTOR = 0.52;

    const message = values.message ?? '';
    const textLines = message
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.toUpperCase());

    // Primeiro calculamos o bloco em uma escala base.
    // Depois aplicamos UMA escala global ao bloco inteiro. Assim, círculo,
    // pictograma, barra, gap e texto crescem/reduzem juntos.
    const circleStrokeBase = BASE_CIRCLE_STROKE;
    const circleOuterDiameterBase = BASE_CIRCLE_RADIUS * 2 + circleStrokeBase;
    const longestLineLength = Math.max(1, ...textLines.map((line) => line.length));
    const textWidthBase = longestLineLength * BASE_FONT_SIZE * BASE_GLYPH_WIDTH_FACTOR;
    const contentWidthBase = Math.max(circleOuterDiameterBase, textWidthBase);
    const textHeightBase = textLines.length * BASE_LINE_HEIGHT;
    const contentHeightBase = circleOuterDiameterBase + BASE_CONTENT_GAP + textHeightBase;

    // Escala máxima que mantém TODO o bloco dentro da área segura.
    const fitScale = Math.min(
      safeWidth / contentWidthBase,
      safeHeight / contentHeightBase,
    );

    const contentScale = Math.max(0.35, fitScale);
    const circleRadius = BASE_CIRCLE_RADIUS * contentScale;
    const circleStroke = Math.max(1.5, circleStrokeBase * contentScale);
    const slashStroke = circleStroke;
    const circleOuterDiameter = circleRadius * 2 + circleStroke;
    const contentGap = BASE_CONTENT_GAP * contentScale;
    const fontSize = Math.max(8, BASE_FONT_SIZE * contentScale);
    const lineHeight = Math.max(fontSize * 1.04, BASE_LINE_HEIGHT * contentScale);
    const textBlockHeight = textLines.length * lineHeight;

    // O bloco final é centralizado na área segura, não apenas o texto.
    const contentBlockHeight = circleOuterDiameter + contentGap + textBlockHeight;
    const contentTop = innerTop + safePadding + Math.max(0, (safeHeight - contentBlockHeight) / 2);
    const circleCenterY = contentTop + circleOuterDiameter / 2;
    const textAreaTop = contentTop + circleOuterDiameter + contentGap;
    const textCenterY = textAreaTop + textBlockHeight / 2;

    // O círculo é o elemento que define o eixo visual do símbolo.
    // O pictograma acompanha exatamente o mesmo centro e escala.
    const iconScale = BASE_ICON_SCALE * contentScale;
    const slashLength = circleRadius * 2;

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
        cx: plateCenterX,
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
        x: plateCenterX,
        y: circleCenterY,
        scale: iconScale,
        color: '#000000',
        svg: values.iconSvg,
      });
    }

    elements.push({
      type: 'group',
      transform: `rotate(45 ${plateCenterX} ${circleCenterY})`,
      children: [
        {
          type: 'rect',
          x: plateCenterX - slashStroke / 2,
          y: circleCenterY - slashLength / 2,
          width: slashStroke,
          height: slashLength,
          fill: '#B91C1C',
        },
      ],
    });

    textLines.forEach((line, index) => {
      const y = textCenterY + (index - (textLines.length - 1) / 2) * lineHeight;
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
