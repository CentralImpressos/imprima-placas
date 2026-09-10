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
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
          Categoria
        </label>
        <select
          value={selectedCategoryId}
          onChange={(event) => {
            const nextCategory = categoryOptions.find((category) => category.id === event.target.value);
            const nextTemplate = nextCategory?.templates[0];

            if (nextTemplate) {
              onSelectTemplate(nextTemplate.id as PlateTemplateId);
            }
          }}
          className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
        >
          {categoryOptions.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
          Template
        </label>
        <select
          value={selectedTemplateId}
          onChange={(event) => onSelectTemplate(event.target.value as PlateTemplateId)}
          className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
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
