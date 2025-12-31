import { VectorShape } from "../Types/ToolTypes";
import { renderShapePathWithSize } from "./renderShapePathWithSize";

export const renderShapePath = (shape: VectorShape, cellSize: number, ellipseSegments: number): string => {
  return renderShapePathWithSize(shape, cellSize, ellipseSegments);
};