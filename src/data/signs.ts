import { TEMPLATE_DEFINITIONS } from './templates';
import type { PlateFieldValues, SignDefinition, SignInstance, SignValues } from '../types';

export const SIGN_DEFINITIONS: SignDefinition[] = [
  {
    id: 'aviso-azul-01',
    name: 'Aviso Azul 01',
    categoryId: 'avisos',
    templateId: 'aviso-azul-01',
    fields: [
      { id: 'heading', label: 'Cabeçalho', type: 'text', placeholder: 'ATENÇÃO' },
      { id: 'message', label: 'Texto principal', type: 'textarea', placeholder: 'É PROIBIDA A ENTRADA DE ANIMAIS' },
      { id: 'icon', label: 'Pictograma', type: 'select', placeholder: 'mdi:alert' },
      { id: 'showIcon', label: 'Mostrar pictograma', type: 'toggle' },
    ],
    defaultValues: {
      heading: 'ATENÇÃO',
      message: 'É PROIBIDA A ENTRADA DE ANIMAIS',
      icon: 'mdi:alert',
      showIcon: true,
    },
  },
];

export function getSignDefinitionById(id: string): SignDefinition {
  return SIGN_DEFINITIONS.find((definition) => definition.id === id) ?? SIGN_DEFINITIONS[0];
}

export function getSignDefinitionByTemplateId(templateId: string): SignDefinition {
  return SIGN_DEFINITIONS.find((definition) => definition.templateId === templateId) ?? SIGN_DEFINITIONS[0];
}

export function createSignInstance(definitionId: string, sizeId: string, values?: SignValues): SignInstance {
  const definition = getSignDefinitionById(definitionId);
  const mergedValues = {
    ...definition.defaultValues,
    ...values,
  };

  return {
    definitionId: definition.id,
    sizeId,
    values: mergedValues,
  };
}

export function resolveSignValues(signDefinition: SignDefinition, values: SignValues): PlateFieldValues {
  const resolved = {
    ...signDefinition.defaultValues,
    ...values,
  };

  return {
    heading: typeof resolved.heading === 'string' ? resolved.heading : 'ATENÇÃO',
    message: typeof resolved.message === 'string' ? resolved.message : 'É PROIBIDA A ENTRADA DE ANIMAIS',
    icon: typeof resolved.icon === 'string' ? resolved.icon : 'mdi:alert',
    showIcon: Boolean(resolved.showIcon),
    iconSvg: '',
  };
}

export function resolveTemplateBySignDefinition(signDefinition: SignDefinition) {
  return TEMPLATE_DEFINITIONS.find((template) => template.id === signDefinition.templateId) ?? TEMPLATE_DEFINITIONS[0];
}
