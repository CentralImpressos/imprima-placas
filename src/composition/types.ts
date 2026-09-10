export type GraphicElement =
  | TextElement
  | RectElement
  | CircleElement
  | IconElement
  | GroupElement;

export interface BaseGraphicElement {
  type: string;
}

export interface TextElement extends BaseGraphicElement {
  type: 'text';
  x: number;
  y: number;
  text: string;
  fontFamily?: string;
  fontSize: number;
  fontWeight?: number | string;
  fill?: string;
  anchor?: 'start' | 'middle' | 'end';
  dominantBaseline?: 'alphabetic' | 'middle' | 'central' | 'hanging' | 'ideographic' | 'text-before-edge' | 'text-after-edge';
  letterSpacing?: number;
}

export interface RectElement extends BaseGraphicElement {
  type: 'rect';
  x: number;
  y: number;
  width: number;
  height: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  rx?: number;
  ry?: number;
}

export interface CircleElement extends BaseGraphicElement {
  type: 'circle';
  cx: number;
  cy: number;
  r: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

export interface IconElement extends BaseGraphicElement {
  type: 'icon';
  x: number;
  y: number;
  scale?: number;
  width?: number;
  height?: number;
  color?: string;
  svg: string;
}

export interface GroupElement extends BaseGraphicElement {
  type: 'group';
  transform?: string;
  children: GraphicElement[];
}

export interface Composition {
  widthMm: number;
  heightMm: number;
  elements: GraphicElement[];
}
