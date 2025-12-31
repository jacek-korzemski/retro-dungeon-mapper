import { Point } from "../Types/MapTypes";

export function createCorridorPath(
  start: Point,
  end: Point,
  cellSize: number
): string {
  const dx = end.x - start.x;
  const dy = end.y - start.y;

  // Pojedynczy punkt - jedna kratka
  if (dx === 0 && dy === 0) {
    const left = start.x * cellSize;
    const top = start.y * cellSize;
    const right = (start.x + 1) * cellSize;
    const bottom = (start.y + 1) * cellSize;
    return `M ${left} ${top} L ${right} ${top} L ${right} ${bottom} L ${left} ${bottom} Z`;
  }

  // Korytarz poziomy
  if (dy === 0) {
    const minX = Math.min(start.x, end.x);
    const maxX = Math.max(start.x, end.x);
    return `M ${minX * cellSize} ${start.y * cellSize} 
            L ${(maxX + 1) * cellSize} ${start.y * cellSize} 
            L ${(maxX + 1) * cellSize} ${(start.y + 1) * cellSize} 
            L ${minX * cellSize} ${(start.y + 1) * cellSize} Z`;
  }

  // Korytarz pionowy
  if (dx === 0) {
    const minY = Math.min(start.y, end.y);
    const maxY = Math.max(start.y, end.y);
    return `M ${start.x * cellSize} ${minY * cellSize} 
            L ${(start.x + 1) * cellSize} ${minY * cellSize} 
            L ${(start.x + 1) * cellSize} ${(maxY + 1) * cellSize} 
            L ${start.x * cellSize} ${(maxY + 1) * cellSize} Z`;
  }

  // Korytarz ukośny - od środka do środka, szerokość 1 kratki
  const x1 = start.x * cellSize + cellSize / 2;
  const y1 = start.y * cellSize + cellSize / 2;
  const x2 = end.x * cellSize + cellSize / 2;
  const y2 = end.y * cellSize + cellSize / 2;

  const dirX = x2 - x1;
  const dirY = y2 - y1;
  const len = Math.sqrt(dirX * dirX + dirY * dirY);

  const ndx = dirX / len;
  const ndy = dirY / len;

  const px = -ndy;
  const py = ndx;

  // Stała szerokość dla 1 kratki przy 45°
  const halfWidth = (1.44 * cellSize) / 2;

  const p1 = { x: x1 + px * halfWidth, y: y1 + py * halfWidth };
  const p2 = { x: x1 - px * halfWidth, y: y1 - py * halfWidth };
  const p3 = { x: x2 - px * halfWidth, y: y2 - py * halfWidth };
  const p4 = { x: x2 + px * halfWidth, y: y2 + py * halfWidth };

  return `M ${p1.x} ${p1.y} L ${p4.x} ${p4.y} L ${p3.x} ${p3.y} L ${p2.x} ${p2.y} Z`;
}