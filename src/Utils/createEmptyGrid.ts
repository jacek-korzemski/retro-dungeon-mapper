import { Cell, CellType, SymbolType } from "../Types/MapTypes";

  export function createEmptyGrid(w: number, h: number): Cell[][] {
    return Array(h)
      .fill(null)
      .map(() =>
        Array(w)
          .fill(null)
          .map(() => ({
            type: "empty" as CellType,
            symbol: "none" as SymbolType,
          }))
      );
  }