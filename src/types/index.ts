export type PlateShape = 'rectangle' | 'square' | 'circle' | 'triangle';

export type PlateOrientation = 'portrait' | 'landscape';

export interface PlateDimensions {
  width: number;
  height: number;
}

export interface Plate {
  shape: PlateShape;
  orientation?: PlateOrientation;
  dimensions: PlateDimensions;
  templateId: string;
}

export type PlateRenderGeometry = {
  shape: PlateShape;
  orientation?: PlateOrientation;
  width: number;
  height: number;
  dimensions: PlateDimensions;
  centerX: number;
  centerY: number;
};

export interface PlatePreset {
  id: string;
  name: string;
  shape: PlateShape;
  orientation?: PlateOrientation;
  dimensions: PlateDimensions;
}

export type PlateSize = {
  id: string;
  name: string;
  widthMm: number;
  heightMm: number;
};

export type PlateTemplateId = 'aviso-azul-01' | 'proibido-fumar';

export type PlateCategory = {
  id: string;
  name: string;
  description?: string;
};

export type TemplateFieldType = 'text' | 'textarea' | 'toggle' | 'select';

export type TemplateField = {
  id: string;
  label: string;
  type: TemplateFieldType;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
};

export type PlateFieldValues = {
  heading: string;
  message: string;
  icon: string;
  showIcon: boolean;
  iconSvg?: string;
};

export type SignValue = string | boolean;

export type SignValues = Record<string, SignValue>;

export type SignDefinition = {
  id: string;
  name: string;
  categoryId: string;
  templateId: string;
  fields?: TemplateField[];
  defaultValues?: SignValues;
};

export type SignInstance = {
  definitionId: string;
  sizeId: string;
  values: SignValues;
};

export type TemplateDefinition = {
  id: PlateTemplateId;
  name: string;
  category: string;
  description?: string;
  sizes: string[];
  fields: TemplateField[];
  render: (values: PlateFieldValues, size: PlateSize, geometry?: PlateRenderGeometry) => import('../composition').Composition;
};
