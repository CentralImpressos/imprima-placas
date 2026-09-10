import type { PlateGeometry } from './types';
import type { PlateDimensions, PlateOrientation } from '../types';

export function createCircleGeometry(
  dimensions: PlateDimensions,
  orientation?: PlateOrientation,
): PlateGeometry {
  const diameter = Math.min(dimensions.width, dimensions.height);
  const width = diameter;
  const height = diameter;

  return {
    shape: 'circle',
    orientation,
    width,
    height,
    dimensions: { width, height },
    centerX: width / 2,
    centerY: height / 2,
  };
}
