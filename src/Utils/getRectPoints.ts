import { Point } from "../Types/MapTypes";

export function getRectPoints(
  x0: number,
  y0: number,
  x1: number,
  y1: number
): Point[] {
  const points: Point[] = [];
  const minX = Math.min(x0, x1);
  const maxX = Math.max(x0, x1);
  const minY = Math.min(y0, y1);
  const maxY = Math.max(y0, y1);

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      points.push({ x, y });
    }
  }
  return points;
}