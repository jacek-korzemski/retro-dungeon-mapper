import { Point } from "../Types/MapTypes";

export function createEllipsePath(
  center: Point,
  radiusX: number,
  radiusY: number,
  cellSize: number,
  segments: number = 32
): string {
  // Środek elipsy to lewy górny róg klikniętej kratki
  const cx = center.x * cellSize;
  const cy = center.y * cellSize;
  const rx = radiusX * cellSize;
  const ry = radiusY * cellSize;

  if (rx <= 0 || ry <= 0) return "";

  const points: Point[] = [];
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    points.push({
      x: cx + Math.cos(angle) * rx,
      y: cy + Math.sin(angle) * ry,
    });
  }

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    path += ` L ${points[i].x} ${points[i].y}`;
  }
  path += " Z";

  return path;
}