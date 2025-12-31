import { Point } from "./MapTypes";

export interface VectorShape {
  id: string;
  type: "corridor" | "ellipse" | "polygon";
  fillType: "floor" | "wall";
  startPoint?: Point;
  endPoint?: Point;
  width?: number;
  center?: Point;
  radiusX?: number;
  radiusY?: number;
  vertices?: Point[];
}

export type Tool =
  | "floor"
  | "wall"
  | "erase"
  | "symbol"
  | "rect"
  | "corridor"
  | "ellipse"
  | "polygon"
  | "delete-shape";