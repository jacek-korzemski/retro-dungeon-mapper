import { ColorScheme } from "./ColorTypes";
import { Cell, SymbolType, Point } from "./MapTypes";
import { Tool, VectorShape } from "./ToolTypes";

export interface AppState {
  gridSize: { width: number; height: number };
  grid: Cell[][];
  showGrid: boolean;
  cellSize: number;
  tool: Tool;
  selectedSymbol: SymbolType;
  shapeFillType: 'floor' | 'wall';
  snapAngle: boolean;
  ellipseSegments: number;
  isDrawing: boolean;
  shapeStart: Point | null;
  polygonVertices: Point[];
  previewShape: VectorShape | null;
  cursorCell: Point | null;
  vectorShapes: VectorShape[];
  hoveredShapeId: string | null;
  roomNumber: number;
  colors: ColorScheme;
  showColorEditor: boolean;
  pngCellSize: number;
}

export interface AppActions {
  setGridSize: (size: { width: number; height: number }) => void;
  setGrid: React.Dispatch<React.SetStateAction<Cell[][]>>;
  setShowGrid: (show: boolean) => void;
  setCellSize: (size: number) => void;
  resizeGrid: (width: number, height: number) => void;
  clearMap: () => void;
  setTool: (tool: Tool) => void;
  setSelectedSymbol: (symbol: SymbolType) => void;
  setShapeFillType: (type: 'floor' | 'wall') => void;
  setSnapAngle: (snap: boolean) => void;
  setEllipseSegments: (segments: number) => void;
  setIsDrawing: (drawing: boolean) => void;
  setShapeStart: (point: Point | null) => void;
  setPolygonVertices: React.Dispatch<React.SetStateAction<Point[]>>;
  setPreviewShape: (shape: VectorShape | null) => void;
  setCursorCell: (point: Point | null) => void;
  cancelDrawing: () => void;
  setVectorShapes: React.Dispatch<React.SetStateAction<VectorShape[]>>;
  addVectorShape: (shape: VectorShape) => void;
  deleteVectorShape: (id: string) => void;
  deleteAllShapes: () => void;
  setHoveredShapeId: (id: string | null) => void;
  setRoomNumber: React.Dispatch<React.SetStateAction<number>>;
  setColors: React.Dispatch<React.SetStateAction<ColorScheme>>;
  updateColor: (key: keyof ColorScheme, value: string) => void;
  resetColors: () => void;
  setShowColorEditor: (show: boolean) => void;
  setPngCellSize: (size: number) => void;
}