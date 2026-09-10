import type { SignDefinition } from '../types';

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
  {
    id: 'proibido-fumar',
    name: 'Proibido Fumar',
    categoryId: 'proibicao',
    templateId: 'proibido-fumar',
    fields: [
      { id: 'heading', label: 'Título', type: 'text', placeholder: 'PROIBIDO' },
      { id: 'message', label: 'Mensagem', type: 'textarea', placeholder: 'FUMAR' },
      { id: 'icon', label: 'Pictograma', type: 'select', placeholder: 'mdi:smoking-off' },
      { id: 'showIcon', label: 'Mostrar pictograma', type: 'toggle' },
    ],
    defaultValues: {
      heading: 'PROIBIDO',
      message: 'FUMAR',
      icon: 'mdi:smoking',
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

