import { AVISO_AZUL_01 } from '../templates/avisoAzul01';
import type { PlateTemplateId, TemplateDefinition } from '../types';

export const TEMPLATE_DEFINITIONS: TemplateDefinition[] = [AVISO_AZUL_01];

export function getTemplateById(templateId: PlateTemplateId): TemplateDefinition {
  return TEMPLATE_DEFINITIONS.find((template) => template.id === templateId) ?? TEMPLATE_DEFINITIONS[0];
}
