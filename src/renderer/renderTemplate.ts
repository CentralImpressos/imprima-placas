import { getTemplateById } from '../data/templates';
import { PLATE_SIZES } from '../data/sizes';
import { createPlateFromLegacySize, getPlateGeometry } from '../geometry';
import type { PlateFieldValues, PlateSize, PlateTemplateId } from '../types';

export function getSizeById(sizeId: string): PlateSize {
  return PLATE_SIZES.find((size) => size.id === sizeId) ?? PLATE_SIZES[2];
}

export function renderTemplate(
  templateId: PlateTemplateId,
  sizeId: string,
  values: PlateFieldValues,
): string {
  const template = getTemplateById(templateId);
  const size = getSizeById(sizeId);
  const plate = createPlateFromLegacySize(size, templateId, 'rectangle');
  const geometry = getPlateGeometry(plate.shape, plate.dimensions, plate.orientation);

  void geometry;

  return template.render(values, size);
}
