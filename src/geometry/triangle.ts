import type { PlateGeometry } from './types';
import type { PlateDimensions, PlateOrientation } from '../types';

export function createTriangleGeometry(
  dimensions: PlateDimensions,
  orientation?: PlateOrientation,
): PlateGeometry {
  const width = dimensions.width;
  const height = dimensions.height;

  return {
    shape: 'triangle',
    orientation,
    width,
    height,
    dimensions: { width, height },
    centerX: width / 2,
    centerY: height / 2,
  };
}
