export type PlateSize = {
  id: string;
  name: string;
  widthMm: number;
  heightMm: number;
};

export type PlateTemplateId = 'aviso-azul-01';

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
};

export type TemplateDefinition = {
  id: PlateTemplateId;
  name: string;
  category: string;
  description?: string;
  sizes: string[];
  fields: TemplateField[];
  render: (values: PlateFieldValues, size: PlateSize) => string;
};
