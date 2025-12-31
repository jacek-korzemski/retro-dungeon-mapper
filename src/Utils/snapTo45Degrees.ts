import { Point } from "../Types/MapTypes";

export function snapTo45Degrees(start: Point, end: Point): Point {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const angle = Math.atan2(dy, dx);
  const snappedAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
  const distance = Math.sqrt(dx * dx + dy * dy);

  return {
    x: start.x + Math.round(Math.cos(snappedAngle) * distance),
    y: start.y + Math.round(Math.sin(snappedAngle) * distance),
  };
}