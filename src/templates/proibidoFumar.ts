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
    const width = geometry?.width ?? size.widthMm;
    const height = geometry?.height ?? size.heightMm;
    const plateCenterX = width / 2;

    // Todas as medidas abaixo estão em mm. A composição é calculada como um
    // único bloco (círculo + respiro + texto), que depois é centralizado na
    // área útil da placa. Isso evita que o conteúdo fique "puxado" para cima.
    const BASE_WIDTH = 200;
    const BASE_CIRCLE_RADIUS = 66;
    const BASE_CIRCLE_STROKE = 12;
    const BASE_ICON_SCALE = 4.62;
    const scale = width / BASE_WIDTH;

    const outerMargin = Math.max(4, 5 * scale);
    const outerBorderWidth = Math.max(2, 2.5 * scale);
    const borderRadius = Math.max(4, 5 * scale);

    const innerLeft = outerMargin + outerBorderWidth;
    const innerRight = width - outerMargin - outerBorderWidth;
    const innerTop = outerMargin + outerBorderWidth;
    const innerBottom = height - outerMargin - outerBorderWidth;
    const innerWidth = innerRight - innerLeft;
    const innerHeight = innerBottom - innerTop;

    const circleRadius = Math.min(
      BASE_CIRCLE_RADIUS * scale,
      innerWidth * 0.36,
      innerHeight * 0.32,
    );
    const circleStroke = Math.min(BASE_CIRCLE_STROKE * scale, circleRadius * 0.18);
    const slashStroke = circleStroke;
    const slashLength = 2 * Math.sqrt(Math.max(0, circleRadius ** 2 - (slashStroke / 2) ** 2));
    const iconScale = BASE_ICON_SCALE * (circleRadius / BASE_CIRCLE_RADIUS);

    const heading = values.heading?.trim().toUpperCase() || 'PROIBIDO';
    const message = values.message?.trim() || 'FUMAR';
    const messageLines = message
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.toUpperCase());

    // O título é parte fixa da composição. Evita duplicá-lo se o usuário já
    // digitou "PROIBIDO" como primeira linha.
    const safeLines = messageLines.length > 0 ? messageLines : ['FUMAR'];
    const textLines = safeLines[0] === heading ? safeLines : [heading, ...safeLines];

    // Respiro proposital entre o símbolo e o texto. Ele cresce de forma
    // proporcional, mas nunca fica pequeno demais em placas menores.
    const contentGap = Math.max(7, 14 * scale);
    const textHorizontalPadding = Math.max(6, 8 * scale);
    const maxTextWidth = Math.max(1, innerWidth - textHorizontalPadding * 2);

    // Estimativa conservadora da largura dos glifos do Barlow Semi Condensed.
    // O objetivo é ocupar a maior largura possível sem tocar a moldura.
    const glyphWidthFactor = 0.52;
    const maxFontByWidth = Math.min(
      0.24 * width,
      maxTextWidth / Math.max(1, ...textLines.map((line) => line.length)) / glyphWidthFactor,
    );

    // O bloco inteiro precisa caber verticalmente. Primeiro calculamos o
    // tamanho máximo de fonte considerando o círculo, o gap e todas as linhas.
    const lineHeightFactor = 1.04;
    const availableTextHeight = Math.max(1, innerHeight - circleRadius * 2 - contentGap);
    const maxFontByHeight = availableTextHeight / Math.max(1, textLines.length * lineHeightFactor);
    const fontSize = Math.max(8, Math.min(maxFontByWidth, maxFontByHeight));
    const lineHeight = fontSize * lineHeightFactor;
    const textBlockHeight = textLines.length * lineHeight;

    // O grupo visual completo é centralizado dentro da área útil da placa.
    const contentBlockHeight = circleRadius * 2 + contentGap + textBlockHeight;
    const contentTop = innerTop + Math.max(0, (innerHeight - contentBlockHeight) / 2);
    const circleCenterY = contentTop + circleRadius;
    const textAreaTop = circleCenterY + circleRadius + contentGap;
    const textCenterY = textAreaTop + textBlockHeight / 2;

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
