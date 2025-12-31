import { VectorShape } from "../Types/ToolTypes";
import { createCorridorPath } from "./createCorridorPath";
import { createEllipsePath } from "./createElipsePath";
import { createPolygonPath } from "./createPolygonPath";

  export const renderShapePathWithSize = (
    shape: VectorShape,
    size: number,
    segments: number
  ): string => {
    switch (shape.type) {
      case "corridor":
        return createCorridorPath(shape.startPoint!, shape.endPoint!, size);
      case "ellipse":
        return createEllipsePath(
          shape.center!,
          shape.radiusX!,
          shape.radiusY!,
          size,
          segments
        );
      case "polygon":
        return createPolygonPath(shape.vertices!, size);
      default:
        return "";
    }
  };