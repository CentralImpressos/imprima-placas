import type { PlateGeometry } from './types';
import type { PlateDimensions, PlateOrientation } from '../types';

export function createRectangleGeometry(
  dimensions: PlateDimensions,
  orientation?: PlateOrientation,
): PlateGeometry {
  const width = dimensions.width;
  const height = dimensions.height;

  return {
    shape: 'rectangle',
    orientation,
    width,
    height,
    dimensions: { width, height },
    centerX: width / 2,
    centerY: height / 2,
  };
}
