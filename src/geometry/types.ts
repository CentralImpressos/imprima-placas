import type { PlateDimensions, PlateGeometry, PlateOrientation } from '../types';

export type { PlateGeometry };

export interface SafeAreaBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type PlateGeometryFactory = (dimensions: PlateDimensions, orientation?: PlateOrientation) => PlateGeometry;
