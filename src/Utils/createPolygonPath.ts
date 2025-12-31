import { Point } from "../Types/MapTypes";

export function createPolygonPath(vertices: Point[], cellSize: number): string {
  if (vertices.length < 3) return "";

  // Wierzchołki to lewe górne rogi klikniętych kratek
  const points = vertices.map((v) => ({
    x: v.x * cellSize,
    y: v.y * cellSize,
  }));

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    path += ` L ${points[i].x} ${points[i].y}`;
  }
  path += " Z";

  return path;
}