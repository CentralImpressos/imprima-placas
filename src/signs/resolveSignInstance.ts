import { PLATE_SIZES } from '../data/sizes';
import { getSignDefinitionById, getSignDefinitionByTemplateId, createSignInstance } from '../data/signs';
import { getTemplateById } from '../data/templates';
import type { PlateFieldValues, PlateSize, PlateTemplateId, SignDefinition, SignInstance, TemplateDefinition } from '../types';

export type ResolvedSign = {
  instance: SignInstance;
  definition: SignDefinition;
  size: PlateSize;
  template: TemplateDefinition;
  values: PlateFieldValues;
};

export function resolveSignInstance(instance: SignInstance): ResolvedSign {
  const definition = getSignDefinitionById(instance.definitionId);
  const template = getTemplateById(definition.templateId as PlateTemplateId);
  const size = PLATE_SIZES.find((item) => item.id === instance.sizeId) ?? PLATE_SIZES[2];
  const mergedValues = {
    ...definition.defaultValues,
    ...instance.values,
  };

  const values: PlateFieldValues = {
    heading: typeof mergedValues.heading === 'string' ? mergedValues.heading : 'ATENÇÃO',
    message: typeof mergedValues.message === 'string' ? mergedValues.message : 'É PROIBIDA A ENTRADA DE ANIMAIS',
    icon: typeof mergedValues.icon === 'string' ? mergedValues.icon : 'mdi:alert',
    showIcon: Boolean(mergedValues.showIcon),
    iconSvg: '',
  };

  return {
    instance,
    definition,
    size,
    template,
    values,
  };
}

export function resolveTemplateSelection(currentInstance: SignInstance, nextTemplateId: string): SignInstance {
  const nextDefinition = getSignDefinitionByTemplateId(nextTemplateId);

  return createSignInstance(nextDefinition.id, currentInstance.sizeId, {
    ...currentInstance.values,
    ...nextDefinition.defaultValues,
  });
}

export function updateSignValue(currentInstance: SignInstance, fieldId: string, value: string | boolean): SignInstance {
  return {
    ...currentInstance,
    values: {
      ...currentInstance.values,
      [fieldId]: value,
    },
  };
}

export function setSignSize(currentInstance: SignInstance, sizeId: string): SignInstance {
  return {
    ...currentInstance,
    sizeId,
  };
}
