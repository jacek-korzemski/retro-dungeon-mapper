import { VectorShape } from "./ToolTypes";

export type CellType = "empty" | "floor" | "wall";
export type SymbolType =
  | "none"
  | "door"
  | "door-secret"
  | "stairs-up"
  | "stairs-down"
  | "skull"
  | "star"
  | "trap"
  | "chest"
  | "pillar"
  | "water"
  | "entrance"
  | "exit"
  | "monster"
  | "npc";

export interface Cell {
  type: CellType;
  symbol: SymbolType;
  number?: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface MapData {
  version: string;
  gridSize: { width: number; height: number };
  grid: Cell[][];
  vectorShapes: VectorShape[];
  roomNumber: number;
}