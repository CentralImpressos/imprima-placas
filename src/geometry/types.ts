import type { PlateDimensions, PlateOrientation, PlateShape } from '../types';

export interface PlateGeometry {
  shape: PlateShape;
  orientation?: PlateOrientation;
  width: number;
  height: number;
  dimensions: PlateDimensions;
  centerX: number;
  centerY: number;
}

export interface SafeAreaBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type PlateGeometryFactory = (dimensions: PlateDimensions, orientation?: PlateOrientation) => PlateGeometry;
