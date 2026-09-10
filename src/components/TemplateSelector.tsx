import { useMemo } from 'react';
import { CATEGORIES } from '../data/categories';
import { TEMPLATE_DEFINITIONS } from '../data/templates';
import type { PlateCategory, PlateTemplateId, TemplateDefinition } from '../types';

type TemplateSelectorProps = {
  selectedTemplateId: PlateTemplateId;
  onSelectTemplate: (templateId: PlateTemplateId) => void;
};

export function TemplateSelector({ selectedTemplateId, onSelectTemplate }: TemplateSelectorProps) {
  const categories = CATEGORIES as PlateCategory[];

  const selectedCategoryId = useMemo(() => {
    const selectedTemplate = TEMPLATE_DEFINITIONS.find((template) => template.id === selectedTemplateId);
    return (
      categories.find((category) =>
        TEMPLATE_DEFINITIONS.some(
          (template) => template.category === category.name && template.id === selectedTemplateId,
        ),
      )?.id ?? selectedTemplate?.category ?? categories[0]?.id ?? ''
    );
  }, [categories, selectedTemplateId]);

  const categoryOptions = useMemo(
    () =>
      categories.map((category) => ({
        ...category,
        templates: TEMPLATE_DEFINITIONS.filter((template) => template.category === category.name),
      })),
    [categories],
  );

  const activeCategory = categoryOptions.find((category) => category.id === selectedCategoryId) ?? categoryOptions[0];
  const availableTemplates: TemplateDefinition[] = activeCategory?.templates ?? TEMPLATE_DEFINITIONS;

  return (
    <div className="template-selector">
      <div className="field-group">
        <label className="field-label">Categoria</label>
        <select
          value={selectedCategoryId}
          onChange={(event) => {
            const nextCategory = categoryOptions.find((category) => category.id === event.target.value);
            const nextTemplate = nextCategory?.templates[0];

            if (nextTemplate) {
              onSelectTemplate(nextTemplate.id as PlateTemplateId);
            }
          }}
          className="field-select"
        >
          {categoryOptions.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="field-group">
        <label className="field-label">Template</label>
        <select
          value={selectedTemplateId}
          onChange={(event) => onSelectTemplate(event.target.value as PlateTemplateId)}
          className="field-select"
        >
          {availableTemplates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
