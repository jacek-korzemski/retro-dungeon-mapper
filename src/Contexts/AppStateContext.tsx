import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { ColorScheme, DEFAULT_COLORS } from "../Types/ColorTypes";
import { createEmptyGrid } from "../Utils/createEmptyGrid";
import { Cell, SymbolType, Point } from "../Types/MapTypes";
import { Tool, VectorShape } from "../Types/ToolTypes";
import { AppState, AppActions } from "../Types/AppTypes";

interface AppContextValue {
  state: AppState;
  actions: AppActions;
}

const AppStateContext = createContext<AppContextValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [gridSize, setGridSize] = useState({ width: 30, height: 25 });
  const [grid, setGrid] = useState<Cell[][]>(() => createEmptyGrid(30, 25));
  const [showGrid, setShowGrid] = useState(true);
  const [cellSize, setCellSize] = useState(28);

  const [tool, setToolState] = useState<Tool>("floor");
  const [selectedSymbol, setSelectedSymbol] = useState<SymbolType>("door");
  const [shapeFillType, setShapeFillType] = useState<"floor" | "wall">("floor");
  const [snapAngle, setSnapAngle] = useState(true);
  const [ellipseSegments, setEllipseSegments] = useState(32);

  const [isDrawing, setIsDrawing] = useState(false);
  const [shapeStart, setShapeStart] = useState<Point | null>(null);
  const [polygonVertices, setPolygonVertices] = useState<Point[]>([]);
  const [previewShape, setPreviewShape] = useState<VectorShape | null>(null);
  const [cursorCell, setCursorCell] = useState<Point | null>(null);

  const [vectorShapes, setVectorShapes] = useState<VectorShape[]>([]);
  const [hoveredShapeId, setHoveredShapeId] = useState<string | null>(null);

  const [roomNumber, setRoomNumber] = useState(1);

  const [colors, setColors] = useState<ColorScheme>(() => {
    const saved = localStorage.getItem("dungeonMapperColors");
    return saved ? JSON.parse(saved) : DEFAULT_COLORS;
  });
  const [showColorEditor, setShowColorEditor] = useState(false);

  const [pngCellSize, setPngCellSize] = useState(64);

  useEffect(() => {
    localStorage.setItem("dungeonMapperColors", JSON.stringify(colors));
  }, [colors]);

  useEffect(() => {
    if (tool !== "delete-shape") {
      setHoveredShapeId(null);
    }
  }, [tool]);

  const setTool = useCallback((newTool: Tool) => {
    setToolState(newTool);
    setShapeStart(null);
    setPreviewShape(null);
    if (newTool !== "polygon") {
      setPolygonVertices([]);
    }
  }, []);

  const cancelDrawing = useCallback(() => {
    setShapeStart(null);
    setPreviewShape(null);
    setPolygonVertices([]);
    setIsDrawing(false);
  }, []);

  const resizeGrid = useCallback((newWidth: number, newHeight: number) => {
    const w = Math.max(5, Math.min(100, newWidth));
    const h = Math.max(5, Math.min(100, newHeight));
    setGridSize({ width: w, height: h });
    setGrid((prev) => {
      const newGrid = createEmptyGrid(w, h);
      for (let y = 0; y < Math.min(prev.length, h); y++) {
        for (let x = 0; x < Math.min(prev[0].length, w); x++) {
          newGrid[y][x] = { ...prev[y][x] };
        }
      }
      return newGrid;
    });
  }, []);

  const clearMap = useCallback(() => {
    if (window.confirm("Wyczyścić całą mapę?")) {
      setGrid(createEmptyGrid(gridSize.width, gridSize.height));
      setVectorShapes([]);
      setRoomNumber(1);
      cancelDrawing();
    }
  }, [gridSize, cancelDrawing]);

  const addVectorShape = useCallback((shape: VectorShape) => {
    setVectorShapes((prev) => [...prev, shape]);
  }, []);

  const deleteVectorShape = useCallback((id: string) => {
    setVectorShapes((prev) => prev.filter((s) => s.id !== id));
    setHoveredShapeId(null);
  }, []);

  const deleteAllShapes = useCallback(() => {
    if (window.confirm("Usunąć wszystkie kształty wektorowe?")) {
      setVectorShapes([]);
    }
  }, []);

  const updateColor = useCallback((key: keyof ColorScheme, value: string) => {
    setColors((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetColors = useCallback(() => {
    if (window.confirm("Przywrócić domyślne kolory?")) {
      setColors(DEFAULT_COLORS);
    }
  }, []);

  const state: AppState = {
    gridSize,
    grid,
    showGrid,
    cellSize,
    tool,
    selectedSymbol,
    shapeFillType,
    snapAngle,
    ellipseSegments,
    isDrawing,
    shapeStart,
    polygonVertices,
    previewShape,
    cursorCell,
    vectorShapes,
    hoveredShapeId,
    roomNumber,
    colors,
    showColorEditor,
    pngCellSize,
  };

  const actions: AppActions = {
    setGridSize,
    setGrid,
    setShowGrid,
    setCellSize,
    resizeGrid,
    clearMap,
    setTool,
    setSelectedSymbol,
    setShapeFillType,
    setSnapAngle,
    setEllipseSegments,
    setIsDrawing,
    setShapeStart,
    setPolygonVertices,
    setPreviewShape,
    setCursorCell,
    cancelDrawing,
    setVectorShapes,
    addVectorShape,
    deleteVectorShape,
    deleteAllShapes,
    setHoveredShapeId,
    setRoomNumber,
    setColors,
    updateColor,
    resetColors,
    setShowColorEditor,
    setPngCellSize,
  };

  return (
    <AppStateContext.Provider value={{ state, actions }}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used within AppStateProvider");
  }
  return context;
}
