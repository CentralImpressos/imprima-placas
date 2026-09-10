import type { Plate, PlateDimensions, PlateOrientation, PlateShape, PlateSize } from '../types';
import { createCircleGeometry } from './circle';
import { createRectangleGeometry } from './rectangle';
import { createTriangleGeometry } from './triangle';

export function getPlateGeometry(
  shape: PlateShape,
  dimensions: PlateDimensions,
  orientation?: PlateOrientation,
) {
  switch (shape) {
    case 'rectangle':
      return createRectangleGeometry(dimensions, orientation);
    case 'square':
      return createRectangleGeometry(dimensions, orientation);
    case 'circle':
      return createCircleGeometry(dimensions, orientation);
    case 'triangle':
      return createTriangleGeometry(dimensions, orientation);
    default:
      return createRectangleGeometry(dimensions, orientation);
  }
}

export function plateSizeToDimensions(size: PlateSize): PlateDimensions {
  return {
    width: size.widthMm,
    height: size.heightMm,
  };
}

export function createPlateFromLegacySize(
  size: PlateSize,
  templateId: string,
  shape: PlateShape = 'rectangle',
  orientation: PlateOrientation = size.widthMm >= size.heightMm ? 'landscape' : 'portrait',
): Plate {
  return {
    shape,
    orientation: shape === 'square' ? undefined : orientation,
    dimensions: plateSizeToDimensions(size),
    templateId,
  };
}

export function getGeometryFromLegacySize(
  size: PlateSize,
  templateId: string,
  shape: PlateShape = 'rectangle',
  orientation?: PlateOrientation,
): Plate {
  const resolvedOrientation = shape === 'square'
    ? undefined
    : orientation ?? (size.widthMm >= size.heightMm ? 'landscape' : 'portrait');

  return {
    shape,
    orientation: resolvedOrientation,
    dimensions: plateSizeToDimensions(size),
    templateId,
  };
}

export { createCircleGeometry, createRectangleGeometry, createTriangleGeometry };

export type { PlateGeometry, SafeAreaBounds } from './types';
