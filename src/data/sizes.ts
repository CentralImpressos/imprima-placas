import type { PlateOrientation, PlateSize } from '../types';

export function getPlateOrientationFromSize(
  size: Pick<PlateSize, 'widthMm' | 'heightMm' | 'shape'>,
): PlateOrientation | undefined {
  if (size.shape === 'square' || size.widthMm === size.heightMm) {
    return undefined;
  }

  return size.widthMm > size.heightMm ? 'landscape' : 'portrait';
}

export const PLATE_SIZES: PlateSize[] = [
  { id: '10x15', name: '10 × 15 cm', widthMm: 100, heightMm: 150, shape: 'rectangle', orientation: 'portrait' },
  { id: '15x10', name: '15 × 10 cm', widthMm: 150, heightMm: 100, shape: 'rectangle', orientation: 'landscape' },
  { id: '15x21', name: '15 × 21 cm', widthMm: 150, heightMm: 210, shape: 'rectangle', orientation: 'portrait' },
  { id: '21x15', name: '21 × 15 cm', widthMm: 210, heightMm: 150, shape: 'rectangle', orientation: 'landscape' },
  { id: '20x30', name: '20 × 30 cm', widthMm: 200, heightMm: 300, shape: 'rectangle', orientation: 'portrait' },
  { id: '30x20', name: '30 × 20 cm', widthMm: 300, heightMm: 200, shape: 'rectangle', orientation: 'landscape' },
  { id: '20x20', name: '20 × 20 cm', widthMm: 200, heightMm: 200, shape: 'square' },
  { id: '30x40', name: '30 × 40 cm', widthMm: 300, heightMm: 400, shape: 'rectangle', orientation: 'portrait' },
  { id: '40x30', name: '40 × 30 cm', widthMm: 400, heightMm: 300, shape: 'rectangle', orientation: 'landscape' },
  { id: '30x50', name: '30 × 50 cm', widthMm: 300, heightMm: 500, shape: 'rectangle', orientation: 'portrait' },
  { id: '50x30', name: '50 × 30 cm', widthMm: 500, heightMm: 300, shape: 'rectangle', orientation: 'landscape' },
  { id: '40x60', name: '40 × 60 cm', widthMm: 400, heightMm: 600, shape: 'rectangle', orientation: 'portrait' },
  { id: '60x40', name: '60 × 40 cm', widthMm: 600, heightMm: 400, shape: 'rectangle', orientation: 'landscape' },
  { id: '50x70', name: '50 × 70 cm', widthMm: 500, heightMm: 700, shape: 'rectangle', orientation: 'portrait' },
  { id: '70x50', name: '70 × 50 cm', widthMm: 700, heightMm: 500, shape: 'rectangle', orientation: 'landscape' },
  { id: '60x80', name: '60 × 80 cm', widthMm: 600, heightMm: 800, shape: 'rectangle', orientation: 'portrait' },
  { id: '80x60', name: '80 × 60 cm', widthMm: 800, heightMm: 600, shape: 'rectangle', orientation: 'landscape' },
];
