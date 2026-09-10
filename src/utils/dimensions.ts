import type { PlateDimensions, PlateOrientation, PlateShape } from '../types';

export function normalizePlateDimensions(
  shape: PlateShape,
  width: number,
  height: number,
  orientation?: PlateOrientation,
): PlateDimensions {
  if (shape === 'square') {
    const size = Math.max(width, height);
    return { width: size, height: size };
  }

  if (shape === 'circle') {
    const diameter = Math.max(width, height);
    return { width: diameter, height: diameter };
  }

  if (shape === 'rectangle' && orientation === 'landscape' && width < height) {
    return { width: height, height: width };
  }

  return { width, height };
}
