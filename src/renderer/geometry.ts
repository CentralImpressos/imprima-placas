import type { FrameType } from '../types';

export interface Point {
  x: number;
  y: number;
}

export interface FrameGeometry {
  width: number;
  height: number;
  points?: Point[];
  centerX: number;
  centerY: number;
  radius?: number;
  triangleSide?: number;
}

/**
 * Converte a dimensão informada pelo editor na geometria física da placa.
 * Losango e círculo são sempre quadrados. Para triângulo, a largura é o lado
 * do triângulo e a altura passa a ser a altura matemática de um equilátero.
 */
export function getFrameGeometry(frameType: FrameType, width: number, height: number): FrameGeometry {
  if (frameType === 'circular' || frameType === 'diamond') {
    const size = Math.min(width, height);
    return {
      width: size,
      height: size,
      centerX: size / 2,
      centerY: size / 2,
      radius: size / 2,
      points: frameType === 'diamond'
        ? [
            { x: size / 2, y: 0 },
            { x: size, y: size / 2 },
            { x: size / 2, y: size },
            { x: 0, y: size / 2 },
          ]
        : undefined,
    };
  }

  if (frameType === 'triangle') {
    const side = Math.min(width, height * 2 / Math.sqrt(3));
    const triangleHeight = side * Math.sqrt(3) / 2;
    return {
      width: side,
      height: triangleHeight,
      centerX: side / 2,
      centerY: triangleHeight / 2,
      triangleSide: side,
      points: [
        { x: side / 2, y: 0 },
        { x: side, y: triangleHeight },
        { x: 0, y: triangleHeight },
      ],
    };
  }

  return {
    width,
    height,
    centerX: width / 2,
    centerY: height / 2,
  };
}

export function insetPolygon(points: Point[], inset: number): Point[] {
  const center = points.reduce((acc, point) => ({ x: acc.x + point.x / points.length, y: acc.y + point.y / points.length }), { x: 0, y: 0 });
  return points.map((point) => {
    const dx = point.x - center.x;
    const dy = point.y - center.y;
    const length = Math.hypot(dx, dy) || 1;
    return { x: point.x - dx / length * inset, y: point.y - dy / length * inset };
  });
}
