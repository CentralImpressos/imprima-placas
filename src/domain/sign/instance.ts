import { getSignDefinitionByTemplateId } from '../../data/signs';
import type { SignInstance, SignValues } from '../../types';

export function createSignInstance(definitionId: string, sizeId: string, values?: SignValues): SignInstance {
  const baseValues = values ?? {};

  return {
    definitionId,
    sizeId,
    values: { ...baseValues },
  };
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

export function setSignTemplate(currentInstance: SignInstance, nextTemplateId: string): SignInstance {
  const nextDefinition = getSignDefinitionByTemplateId(nextTemplateId);

  return createSignInstance(nextDefinition.id, currentInstance.sizeId, {
    ...currentInstance.values,
    ...nextDefinition.defaultValues,
  });
}
