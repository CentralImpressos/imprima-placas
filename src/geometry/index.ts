import type { PlateDimensions, PlateOrientation, PlateShape } from '../types';
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

export { createCircleGeometry, createRectangleGeometry, createTriangleGeometry };

export type { PlateGeometry, SafeAreaBounds } from './types';
