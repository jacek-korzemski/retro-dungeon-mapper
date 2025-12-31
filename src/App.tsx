import React, { useState, useCallback, useRef, useEffect } from "react";
import { Cell, MapData, Point, SymbolType } from "./Types/MapTypes";
import { Tool, VectorShape } from "./Types/ToolTypes";
import { COLOR_LABELS, ColorScheme, DEFAULT_COLORS } from "./Types/ColorTypes";
import { SYMBOLS } from "./Types/SymbolTypes";
import { generateId } from "./Utils/generateId";
import { getRectPoints } from "./Utils/getRectPoints";
import { snapTo45Degrees } from "./Utils/snapTo45Degrees";
import { renderShapePathWithSize } from "./Utils/renderShapePathWithSize";
import { createEmptyGrid } from "./Utils/createEmptyGrid";
import { renderShapePath } from "./Utils/renderShapePath";
import "./App.css";

export default function App() {
  const [gridSize, setGridSize] = useState({ width: 30, height: 25 });
  const [grid, setGrid] = useState<Cell[][]>(() => createEmptyGrid(30, 25));
  const [tool, setTool] = useState<Tool>("floor");
  const [selectedSymbol, setSelectedSymbol] = useState<SymbolType>("door");
  const [isDrawing, setIsDrawing] = useState(false);
  const [vectorShapes, setVectorShapes] = useState<VectorShape[]>([]);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [shapeFillType, setShapeFillType] = useState<"floor" | "wall">("floor");
  const [ellipseSegments, setEllipseSegments] = useState(32);
  const [snapAngle, setSnapAngle] = useState(true);
  const [shapeStart, setShapeStart] = useState<Point | null>(null);
  const [polygonVertices, setPolygonVertices] = useState<Point[]>([]);
  const [previewShape, setPreviewShape] = useState<VectorShape | null>(null);
  const [roomNumber, setRoomNumber] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [cellSize, setCellSize] = useState(28);
  const [pngCellSize, setPngCellSize] = useState(64);
  const [showColorEditor, setShowColorEditor] = useState(false);
  const [hoveredShapeId, setHoveredShapeId] = useState<string | null>(null);
  const [cursorCell, setCursorCell] = useState<Point | null>(null);
  const [colors, setColors] = useState<ColorScheme>(() => {
    const saved = localStorage.getItem("dungeonMapperColors");
    return saved ? JSON.parse(saved) : DEFAULT_COLORS;
  });

  const canvasRef = useRef<HTMLDivElement>(null);

  const handleCellAction = useCallback(
    (row: number, col: number) => {
      setGrid((prev) => {
        const newGrid = prev.map((r) => r.map((c) => ({ ...c })));
        const cell = newGrid[row][col];

        switch (tool) {
          case "floor":
            cell.type = "floor";
            break;
          case "wall":
            cell.type = "wall";
            break;
          case "erase":
            cell.type = "empty";
            cell.symbol = "none";
            cell.number = undefined;
            break;
          case "symbol":
            cell.symbol =
              cell.symbol === selectedSymbol ? "none" : selectedSymbol;
            break;
        }
        return newGrid;
      });
    },
    [tool, selectedSymbol]
  );

  const handleMouseDown = (row: number, col: number, e: React.MouseEvent) => {
    // RMB - cancel drawing
    if (e.button === 2) {
      e.preventDefault();

      if (shapeStart || polygonVertices.length > 0) {
        setShapeStart(null);
        setPreviewShape(null);
        setPolygonVertices([]);
        return;
      }

      addRoomNumber(row, col);
      return;
    }

    const point = { x: col, y: row };

    switch (tool) {
      case "floor":
      case "wall":
      case "erase":
      case "symbol":
        setIsDrawing(true);
        handleCellAction(row, col);
        break;

      case "rect":
        setShapeStart(point);
        setIsDrawing(true);
        break;

      case "corridor":
      case "ellipse":
        if (!shapeStart) {
          setShapeStart(point);
        } else {
          finishVectorShape(point);
        }
        break;

      case "polygon":
        setPolygonVertices((prev) => [...prev, point]);
        break;

      case "delete-shape":
        break;
    }
  };

  const handleMouseMove = (row: number, col: number) => {
    const point = { x: col, y: row };
    setCursorCell(point);

    if (
      isDrawing &&
      (tool === "floor" ||
        tool === "wall" ||
        tool === "erase" ||
        tool === "symbol")
    ) {
      handleCellAction(row, col);
      return;
    }

    if (shapeStart && (tool === "corridor" || tool === "ellipse")) {
      let endPoint = point;

      if (tool === "corridor" && snapAngle) {
        endPoint = snapTo45Degrees(shapeStart, endPoint);
      }

      if (tool === "corridor") {
        setPreviewShape({
          id: "preview",
          type: "corridor",
          fillType: shapeFillType,
          startPoint: shapeStart,
          endPoint: endPoint,
          // usuń: width: corridorWidth,
        });
      } else if (tool === "ellipse") {
        const radiusX = Math.abs(endPoint.x - shapeStart.x);
        const radiusY = Math.abs(endPoint.y - shapeStart.y);
        setPreviewShape({
          id: "preview",
          type: "ellipse",
          fillType: shapeFillType,
          center: shapeStart,
          radiusX,
          radiusY,
        });
      }
    }
  };

  const handleMouseUp = (row: number, col: number) => {
    if (isDrawing && tool === "rect" && shapeStart) {
      const points = getRectPoints(shapeStart.x, shapeStart.y, col, row);
      setGrid((prev) => {
        const newGrid = prev.map((r) => r.map((c) => ({ ...c })));
        points.forEach(({ x, y }) => {
          if (y >= 0 && y < newGrid.length && x >= 0 && x < newGrid[0].length) {
            newGrid[y][x].type = shapeFillType === "floor" ? "floor" : "wall";
          }
        });
        return newGrid;
      });
    }

    setIsDrawing(false);
    if (tool === "rect") {
      setShapeStart(null);
    }
  };

  const finishVectorShape = (endPoint: Point) => {
    if (!shapeStart) return;

    let finalEndPoint = endPoint;
    if (tool === "corridor" && snapAngle) {
      finalEndPoint = snapTo45Degrees(shapeStart, finalEndPoint);
    }

    if (tool === "corridor") {
      const newShape: VectorShape = {
        id: generateId(),
        type: "corridor",
        fillType: shapeFillType,
        startPoint: shapeStart,
        endPoint: finalEndPoint,
      };
      setVectorShapes((prev) => [...prev, newShape]);
    } else if (tool === "ellipse") {
      const radiusX = Math.abs(finalEndPoint.x - shapeStart.x);
      const radiusY = Math.abs(finalEndPoint.y - shapeStart.y);
      if (radiusX > 0 || radiusY > 0) {
        const newShape: VectorShape = {
          id: generateId(),
          type: "ellipse",
          fillType: shapeFillType,
          center: shapeStart,
          radiusX,
          radiusY,
        };
        setVectorShapes((prev) => [...prev, newShape]);
      }
    }

    setShapeStart(null);
    setPreviewShape(null);
  };

  const handleGlobalMouseUp = () => {
    setIsDrawing(false);
    if (tool === "rect") {
      setShapeStart(null);
      setPreviewShape(null);
    }
  };

  const handleDeleteShape = (shapeId: string) => {
    setVectorShapes((prev) => prev.filter((s) => s.id !== shapeId));
    setHoveredShapeId(null);
  };

  const finishPolygon = () => {
    if (polygonVertices.length >= 3) {
      const newShape: VectorShape = {
        id: generateId(),
        type: "polygon",
        fillType: shapeFillType,
        vertices: [...polygonVertices],
      };
      setVectorShapes((prev) => [...prev, newShape]);
    }
    setPolygonVertices([]);
  };

  const cancelPolygon = () => {
    setPolygonVertices([]);
  };

  const addRoomNumber = (row: number, col: number) => {
    setGrid((prev) => {
      const newGrid = prev.map((r) => r.map((c) => ({ ...c })));
      const cell = newGrid[row][col];
      if (cell.number) {
        cell.number = undefined;
      } else {
        cell.number = roomNumber;
        setRoomNumber(roomNumber + 1);
      }
      return newGrid;
    });
  };

  const deleteSelectedShape = () => {
    if (selectedShapeId) {
      setVectorShapes((prev) => prev.filter((s) => s.id !== selectedShapeId));
      setSelectedShapeId(null);
    }
  };

  const deleteAllShapes = () => {
    if (window.confirm("Usunąć wszystkie kształty wektorowe?")) {
      setVectorShapes([]);
      setSelectedShapeId(null);
    }
  };

  const clearMap = () => {
    if (window.confirm("Wyczyścić całą mapę (siatkę i kształty)?")) {
      setGrid(createEmptyGrid(gridSize.width, gridSize.height));
      setVectorShapes([]);
      setRoomNumber(1);
      setPolygonVertices([]);
      setSelectedShapeId(null);
    }
  };

  const resizeGrid = (newWidth: number, newHeight: number) => {
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
  };

  const exportToSVG = () => {
    const width = gridSize.width * cellSize;
    const height = gridSize.height * cellSize;
    const c = colors;

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">`;
    svg += `<rect width="${width}" height="${height}" fill="${c.bg}"/>`;

    grid.forEach((row, y) => {
      row.forEach((cell, x) => {
        const cx = x * cellSize;
        const cy = y * cellSize;

        if (cell.type === "floor") {
          svg += `<rect x="${cx}" y="${cy}" width="${cellSize}" height="${cellSize}" fill="${c.floor}"/>`;
        } else if (cell.type === "wall") {
          svg += `<rect x="${cx}" y="${cy}" width="${cellSize}" height="${cellSize}" fill="${c.wall}"/>`;
        }
      });
    });

    vectorShapes.forEach((shape) => {
      const path = renderShapePath(shape, cellSize, ellipseSegments);
      const fill = shape.fillType === "floor" ? c.floor : c.wall;
      svg += `<path d="${path}" fill="${fill}" stroke="none"/>`;
    });

    if (showGrid) {
      for (let x = 0; x <= gridSize.width; x++) {
        svg += `<line x1="${x * cellSize}" y1="0" x2="${
          x * cellSize
        }" y2="${height}" stroke="${c.gridLine}" stroke-width="1"/>`;
      }
      for (let y = 0; y <= gridSize.height; y++) {
        svg += `<line x1="0" y1="${y * cellSize}" x2="${width}" y2="${
          y * cellSize
        }" stroke="${c.gridLine}" stroke-width="1"/>`;
      }
    }

    grid.forEach((row, y) => {
      row.forEach((cell, x) => {
        const cx = x * cellSize + cellSize / 2;
        const cy = y * cellSize + cellSize / 2;

        if (cell.symbol !== "none") {
          svg += `<text x="${cx}" y="${cy}" dominant-baseline="central" text-anchor="middle" fill="${
            c.symbol
          }" font-family="monospace" font-size="${
            cellSize * 0.5
          }" font-weight="bold">${SYMBOLS[cell.symbol].char}</text>`;
        }

        if (cell.number) {
          svg += `<text x="${cx}" y="${cy}" dominant-baseline="central" text-anchor="middle" fill="${
            c.accent
          }" font-family="serif" font-size="${
            cellSize * 0.4
          }" font-weight="bold">${cell.number}</text>`;
        }
      });
    });

    svg += "</svg>";

    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dungeon-map.svg";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToPNG = () => {
    const exportSize = pngCellSize;
    const width = gridSize.width * exportSize;
    const height = gridSize.height * exportSize;
    const c = colors;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = c.bg;
    ctx.fillRect(0, 0, width, height);

    grid.forEach((row, y) => {
      row.forEach((cell, x) => {
        const cx = x * exportSize;
        const cy = y * exportSize;

        if (cell.type === "floor") {
          ctx.fillStyle = c.floor;
          ctx.fillRect(cx, cy, exportSize, exportSize);
        } else if (cell.type === "wall") {
          ctx.fillStyle = c.wall;
          ctx.fillRect(cx, cy, exportSize, exportSize);
        }
      });
    });

    vectorShapes.forEach((shape) => {
      const pathString = renderShapePathWithSize(
        shape,
        exportSize,
        ellipseSegments
      );
      const path = new Path2D(pathString);
      ctx.fillStyle = shape.fillType === "floor" ? c.floor : c.wall;
      ctx.fill(path);
    });

    if (showGrid) {
      ctx.strokeStyle = c.gridLine;
      ctx.lineWidth = 1;

      for (let x = 0; x <= gridSize.width; x++) {
        ctx.beginPath();
        ctx.moveTo(x * exportSize, 0);
        ctx.lineTo(x * exportSize, height);
        ctx.stroke();
      }
      for (let y = 0; y <= gridSize.height; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * exportSize);
        ctx.lineTo(width, y * exportSize);
        ctx.stroke();
      }
    }

    grid.forEach((row, y) => {
      row.forEach((cell, x) => {
        const cx = x * exportSize + exportSize / 2;
        const cy = y * exportSize + exportSize / 2;

        if (cell.symbol !== "none") {
          ctx.font = `bold ${exportSize * 0.5}px monospace`;
          ctx.fillStyle = c.symbol;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(SYMBOLS[cell.symbol].char, cx, cy);
        }

        if (cell.number) {
          ctx.font = `bold ${exportSize * 0.4}px serif`;
          ctx.fillStyle = c.accent;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(String(cell.number), cx, cy);
        }
      });
    });

    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "dungeon-map.png";
        a.click();
        URL.revokeObjectURL(url);
      }
    }, "image/png");
  };

  const isVectorTool =
    tool === "corridor" || tool === "ellipse" || tool === "polygon";
  const canvasWidth = gridSize.width * cellSize;
  const canvasHeight = gridSize.height * cellSize;

  useEffect(() => {
    localStorage.setItem("dungeonMapperColors", JSON.stringify(colors));
  }, [colors]);

  const updateColor = (key: keyof ColorScheme, value: string) => {
    setColors((prev) => ({ ...prev, [key]: value }));
  };

  const resetColors = () => {
    if (window.confirm("Przywrócić domyślne kolory?")) {
      setColors(DEFAULT_COLORS);
    }
  };

  const exportColors = () => {
    const blob = new Blob([JSON.stringify(colors, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dungeon-colors.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importColors = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        setColors({ ...DEFAULT_COLORS, ...imported });
      } catch {
        alert("Błąd wczytywania pliku kolorów");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const saveMap = () => {
    const mapData: MapData = {
      version: "3.3",
      gridSize,
      grid,
      vectorShapes,
      roomNumber,
    };

    const blob = new Blob([JSON.stringify(mapData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dungeon-map.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadMap = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data: MapData = JSON.parse(event.target?.result as string);

        setGridSize(data.gridSize);
        setGrid(data.grid);
        setVectorShapes(data.vectorShapes || []);
        setRoomNumber(data.roomNumber || 1);
        setPolygonVertices([]);
        setSelectedShapeId(null);
      } catch {
        alert("Błąd wczytywania mapy");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  useEffect(() => {
    if (tool !== "delete-shape") {
      setHoveredShapeId(null);
    }
  }, [tool]);

  return (
    <div
      className={`app`}
      onMouseUp={handleGlobalMouseUp}
      onMouseLeave={handleGlobalMouseUp}
      onKeyDown={(e) => {
        if (e.key === "Delete" && selectedShapeId) deleteSelectedShape();
        if (e.key === "Escape") {
          setShapeStart(null);
          setPreviewShape(null);
          setPolygonVertices([]);
          setHoveredShapeId(null);
        }
      }}
      tabIndex={0}
      style={
        {
          "--bg-primary": colors.bg,
          "--bg-secondary": colors.floor,
          "--bg-tertiary": colors.border,
          "--color-floor": colors.floor,
          "--color-wall": colors.wall,
          "--color-empty": colors.empty,
          "--color-text": colors.text,
          "--color-accent": colors.accent,
          "--color-border": colors.border,
          "--color-symbol": colors.symbol,
          "--color-grid-line": colors.gridLine,
        } as React.CSSProperties
      }
    >
      <header className="header">
        <h1>⚔️ Retro Dungeon Mapper ⚔️</h1>
        <p className="subtitle">~ Wektorowe lochy w stylu TSR ~</p>
      </header>

      <div className="main-container">
        {/* TOOLBAR */}
        <aside className="toolbar">
          <div className="toolbar-scroll">
            {/* Pędzel */}
            <section className="tool-section">
              <h3>🖌️ Pędzel</h3>
              <div className="tool-buttons">
                <button
                  className={`tool-btn ${tool === "floor" ? "active" : ""}`}
                  onClick={() => setTool("floor")}
                >
                  ▢ Podłoga
                </button>
                <button
                  className={`tool-btn ${tool === "wall" ? "active" : ""}`}
                  onClick={() => setTool("wall")}
                >
                  ▮ Ściana
                </button>
                <button
                  className={`tool-btn ${tool === "erase" ? "active" : ""}`}
                  onClick={() => setTool("erase")}
                >
                  ✕ Wymaż
                </button>
                <button
                  className={`tool-btn ${tool === "symbol" ? "active" : ""}`}
                  onClick={() => setTool("symbol")}
                >
                  ★ Symbol
                </button>
              </div>
            </section>

            {/* Kształty siatkowe */}
            <section className="tool-section">
              <h3>▦ Kształty (siatka)</h3>
              <div className="tool-buttons">
                <button
                  className={`tool-btn ${tool === "rect" ? "active" : ""}`}
                  onClick={() => setTool("rect")}
                >
                  ▭ Prostokąt
                </button>
              </div>
            </section>

            {/* Kształty wektorowe */}
            <section className="tool-section highlight">
              <h3>✨ Kształty wektorowe</h3>
              <div className="tool-buttons">
                <button
                  className={`tool-btn ${tool === "corridor" ? "active" : ""}`}
                  onClick={() => {
                    setTool("corridor");
                    setShapeStart(null);
                    setPreviewShape(null);
                  }}
                >
                  / Korytarz
                </button>
                <button
                  className={`tool-btn ${tool === "ellipse" ? "active" : ""}`}
                  onClick={() => {
                    setTool("ellipse");
                    setShapeStart(null);
                    setPreviewShape(null);
                  }}
                >
                  ◯ Elipsa/Okrąg
                </button>
                <button
                  className={`tool-btn ${tool === "polygon" ? "active" : ""}`}
                  onClick={() => {
                    setTool("polygon");
                    setPolygonVertices([]);
                  }}
                >
                  📐 Wielokąt
                </button>
                <button
                  className={`tool-btn ${
                    tool === "delete-shape" ? "active" : ""
                  }`}
                  onClick={() => setTool("delete-shape")}
                >
                  🗑️ Usuń kształt
                </button>
              </div>

              {/* Status rysowania */}
              {shapeStart && (tool === "corridor" || tool === "ellipse") && (
                <div className="drawing-status">
                  📍 Kliknij aby zakończyć (PPM anuluje)
                </div>
              )}

              {(isVectorTool || tool === "delete-shape" || tool === "rect") && (
                <div className="shape-options">
                  {tool !== "delete-shape" && (
                    <>
                      <label className="option-label">Typ wypełnienia:</label>
                      <div className="radio-group">
                        <label>
                          <input
                            type="radio"
                            checked={shapeFillType === "floor"}
                            onChange={() => setShapeFillType("floor")}
                          />
                          Podłoga
                        </label>
                        <label>
                          <input
                            type="radio"
                            checked={shapeFillType === "wall"}
                            onChange={() => setShapeFillType("wall")}
                          />
                          Ściana
                        </label>
                      </div>
                    </>
                  )}

                  {tool === "corridor" && (
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={snapAngle}
                        onChange={(e) => setSnapAngle(e.target.checked)}
                      />
                      Snap do 45°
                    </label>
                  )}

                  {tool === "ellipse" && (
                    <>
                      <label className="option-label">Gładkość:</label>
                      <div className="slider-row">
                        <input
                          type="range"
                          min="8"
                          max="64"
                          step="4"
                          value={ellipseSegments}
                          onChange={(e) =>
                            setEllipseSegments(parseInt(e.target.value))
                          }
                        />
                        <span>{ellipseSegments}</span>
                      </div>
                    </>
                  )}

                  {tool === "polygon" && (
                    <div className="polygon-controls">
                      <span className="vertex-count">
                        Punkty: {polygonVertices.length}
                      </span>
                      <div className="polygon-buttons">
                        <button
                          className="tool-btn small"
                          onClick={finishPolygon}
                          disabled={polygonVertices.length < 3}
                        >
                          ✓ Zakończ
                        </button>
                        <button
                          className="tool-btn small"
                          onClick={cancelPolygon}
                        >
                          ✕ Anuluj
                        </button>
                      </div>
                    </div>
                  )}

                  {tool === "delete-shape" && (
                    <p className="hint">Kliknij na kształt aby go usunąć</p>
                  )}
                </div>
              )}

              <div className="shape-count">
                Kształtów: {vectorShapes.length}
                {vectorShapes.length > 0 && (
                  <button
                    className="tool-btn small danger"
                    onClick={deleteAllShapes}
                  >
                    Usuń wszystkie
                  </button>
                )}
              </div>
            </section>

            {/* Symbole */}
            {tool === "symbol" && (
              <section className="tool-section">
                <h3>📍 Symbole</h3>
                <p className="hint">
                  Można stawiać wszędzie (też na wektorach)
                </p>
                <div className="symbol-grid">
                  {Object.entries(SYMBOLS)
                    .filter(([key]) => key !== "none")
                    .map(([key, { char, name }]) => (
                      <button
                        key={key}
                        className={`symbol-btn ${
                          selectedSymbol === key ? "active" : ""
                        }`}
                        onClick={() => setSelectedSymbol(key as SymbolType)}
                        title={name}
                      >
                        <span className="symbol-char">{char}</span>
                        <span className="symbol-name">{name}</span>
                      </button>
                    ))}
                </div>
              </section>
            )}

            {/* Numeracja */}
            <section className="tool-section">
              <h3>🔢 Numeracja</h3>
              <div className="number-controls">
                <span>
                  Następny: <strong>{roomNumber}</strong>
                </span>
                <button
                  className="tool-btn small"
                  onClick={() => setRoomNumber(1)}
                >
                  Reset
                </button>
              </div>
              <p className="hint">PPM = numer (wszędzie)</p>
            </section>

            {/* Zoom */}
            <section className="tool-section">
              <h3>🔍 Zoom</h3>
              <div className="slider-row">
                <input
                  type="range"
                  min="16"
                  max="48"
                  value={cellSize}
                  onChange={(e) => setCellSize(parseInt(e.target.value))}
                />
                <span>{cellSize}px</span>
              </div>
              <div className="zoom-buttons">
                <button
                  className="tool-btn small"
                  onClick={() => setCellSize(Math.max(16, cellSize - 4))}
                >
                  −
                </button>
                <button
                  className="tool-btn small"
                  onClick={() => setCellSize(28)}
                >
                  Reset
                </button>
                <button
                  className="tool-btn small"
                  onClick={() => setCellSize(Math.min(48, cellSize + 4))}
                >
                  +
                </button>
              </div>
            </section>

            {/* Kolory */}
            <section className="tool-section">
              <h3>🎨 Kolory</h3>
              <button
                className="tool-btn"
                onClick={() => setShowColorEditor(!showColorEditor)}
              >
                {showColorEditor ? "▲ Zwiń" : "▼ Edytuj kolory"}
              </button>

              {showColorEditor && (
                <div className="color-editor">
                  {(Object.keys(COLOR_LABELS) as Array<keyof ColorScheme>).map(
                    (key) => (
                      <div key={key} className="color-row">
                        <label>{COLOR_LABELS[key]}</label>
                        <input
                          type="color"
                          value={
                            colors[key].startsWith("rgba")
                              ? "#7faacc"
                              : colors[key]
                          }
                          onChange={(e) => updateColor(key, e.target.value)}
                        />
                        <input
                          type="text"
                          value={colors[key]}
                          onChange={(e) => updateColor(key, e.target.value)}
                          className="color-text-input"
                        />
                      </div>
                    )
                  )}

                  <div className="color-actions">
                    <button className="tool-btn small" onClick={resetColors}>
                      Reset
                    </button>
                    <button className="tool-btn small" onClick={exportColors}>
                      Export
                    </button>
                    <label className="tool-btn small file-input-label">
                      Import
                      <input
                        type="file"
                        accept=".json"
                        onChange={importColors}
                        hidden
                      />
                    </label>
                  </div>
                </div>
              )}
            </section>

            {/* Rozmiar */}
            <section className="tool-section">
              <h3>📐 Rozmiar siatki</h3>
              <div className="size-controls">
                <label>
                  Szer:{" "}
                  <input
                    type="number"
                    value={gridSize.width}
                    min={5}
                    max={100}
                    onChange={(e) =>
                      resizeGrid(
                        parseInt(e.target.value) || 30,
                        gridSize.height
                      )
                    }
                  />
                </label>
                <label>
                  Wys:{" "}
                  <input
                    type="number"
                    value={gridSize.height}
                    min={5}
                    max={100}
                    onChange={(e) =>
                      resizeGrid(gridSize.width, parseInt(e.target.value) || 25)
                    }
                  />
                </label>
              </div>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={showGrid}
                  onChange={(e) => setShowGrid(e.target.checked)}
                />
                Pokaż siatkę
              </label>
            </section>

            {/* Zapis/Eksport */}
            <section className="tool-section">
              <h3>💾 Zapis</h3>

              <div className="save-load-row">
                <button className="action-btn" onClick={saveMap}>
                  📁 Zapisz mapę (.json)
                </button>
                <label className="action-btn file-input-label">
                  📂 Wczytaj mapę
                  <input type="file" accept=".json" onChange={loadMap} hidden />
                </label>
              </div>

              <div className="export-divider">Eksport grafiki</div>

              <button className="action-btn" onClick={exportToSVG}>
                📥 Eksportuj SVG
              </button>

              <div className="png-export">
                <label className="option-label">Rozmiar kratki PNG:</label>
                <div className="slider-row">
                  <input
                    type="range"
                    min="32"
                    max="128"
                    step="16"
                    value={pngCellSize}
                    onChange={(e) => setPngCellSize(parseInt(e.target.value))}
                  />
                  <span>{pngCellSize}px</span>
                </div>
                <p className="hint">
                  {gridSize.width * pngCellSize} ×{" "}
                  {gridSize.height * pngCellSize}px
                </p>
                <button className="action-btn" onClick={exportToPNG}>
                  🖼️ Eksportuj PNG
                </button>
              </div>

              <button className="action-btn danger" onClick={clearMap}>
                🗑️ Wyczyść mapę
              </button>
            </section>

            {/* Pomoc */}
            <section className="tool-section help">
              <h3>❓ Pomoc</h3>
              <ul>
                <li>
                  <b>Korytarz/Elipsa:</b> klik → klik
                </li>
                <li>
                  <b>Wielokąt:</b> klik × N → Zakończ
                </li>
                <li>
                  <b>PPM:</b> anuluj lub numer
                </li>
                <li>
                  <b>Esc:</b> anuluj rysowanie
                </li>
                <li>
                  <b>Usuń kształt:</b> klik na kształt
                </li>
              </ul>
            </section>
          </div>
        </aside>

        {/* CANVAS */}
        <main className="canvas-area">
          <div
            className="canvas-wrapper"
            ref={canvasRef}
            style={{ width: canvasWidth, height: canvasHeight }}
          >
            {/* WARSTWA 1: Tło komórek */}
            <div
              className="layer layer-cells"
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${gridSize.width}, ${cellSize}px)`,
                gridTemplateRows: `repeat(${gridSize.height}, ${cellSize}px)`,
              }}
            >
              {grid.map((row, y) =>
                row.map((cell, x) => (
                  <div
                    key={`${x}-${y}`}
                    className={`cell ${cell.type}`}
                    style={{ width: cellSize, height: cellSize }}
                  />
                ))
              )}
            </div>

            {/* WARSTWA 2: Kształty wektorowe */}
            <svg
              className="layer layer-vectors"
              width={canvasWidth}
              height={canvasHeight}
              style={{
                pointerEvents: tool === "delete-shape" ? "auto" : "none",
                zIndex: tool === "delete-shape" ? 200 : 10,
              }}
            >
              {vectorShapes.map((shape, index) => (
                <path
                  key={shape.id}
                  d={renderShapePath(shape, cellSize, ellipseSegments)}
                  fill={shape.fillType === "floor" ? colors.floor : colors.wall}
                  stroke={hoveredShapeId === shape.id ? colors.accent : "none"}
                  strokeWidth={hoveredShapeId === shape.id ? 3 : 0}
                  className={`vector-shape ${
                    hoveredShapeId === shape.id ? "hovered" : ""
                  }`}
                  style={{
                    cursor: tool === "delete-shape" ? "pointer" : "default",
                  }}
                  onMouseEnter={() => {
                    if (tool === "delete-shape") setHoveredShapeId(shape.id);
                  }}
                  onMouseLeave={() => {
                    if (tool === "delete-shape") setHoveredShapeId(null);
                  }}
                  onClick={(e) => {
                    if (tool === "delete-shape") {
                      e.stopPropagation();
                      handleDeleteShape(shape.id);
                    }
                  }}
                />
              ))}

              {previewShape && (
                <path
                  d={renderShapePath(previewShape, cellSize, ellipseSegments)}
                  fill={
                    previewShape.fillType === "floor"
                      ? colors.floor
                      : colors.wall
                  }
                  stroke={colors.accent}
                  strokeWidth={2}
                  strokeDasharray="5,5"
                  opacity={0.7}
                />
              )}
            </svg>

            {/* WARSTWA 3: Siatka */}
            {showGrid && (
              <svg
                className="layer layer-grid"
                width={canvasWidth}
                height={canvasHeight}
              >
                {Array.from({ length: gridSize.width + 1 }, (_, i) => (
                  <line
                    key={`v${i}`}
                    x1={i * cellSize}
                    y1={0}
                    x2={i * cellSize}
                    y2={canvasHeight}
                    stroke={colors.gridLine}
                    strokeWidth={1}
                  />
                ))}
                {Array.from({ length: gridSize.height + 1 }, (_, i) => (
                  <line
                    key={`h${i}`}
                    x1={0}
                    y1={i * cellSize}
                    x2={canvasWidth}
                    y2={i * cellSize}
                    stroke={colors.gridLine}
                    strokeWidth={1}
                  />
                ))}
              </svg>
            )}

            {/* WARSTWA 4: Podgląd wielokąta + narożnik */}
            {(polygonVertices.length > 0 ||
              (tool === "polygon" && cursorCell)) && (
              <svg
                className="layer layer-polygon-preview"
                width={canvasWidth}
                height={canvasHeight}
              >
                {polygonVertices.length > 0 && (
                  <polyline
                    points={polygonVertices
                      .map((v) => `${v.x * cellSize},${v.y * cellSize}`)
                      .join(" ")}
                    fill="none"
                    stroke={colors.accent}
                    strokeWidth={2}
                    strokeDasharray="5,5"
                  />
                )}

                {polygonVertices.map((v, i) => (
                  <circle
                    key={i}
                    cx={v.x * cellSize}
                    cy={v.y * cellSize}
                    r={6}
                    fill={colors.accent}
                    stroke={colors.bg}
                    strokeWidth={2}
                  />
                ))}

                {polygonVertices.length > 0 && cursorCell && (
                  <line
                    x1={
                      polygonVertices[polygonVertices.length - 1].x * cellSize
                    }
                    y1={
                      polygonVertices[polygonVertices.length - 1].y * cellSize
                    }
                    x2={cursorCell.x * cellSize}
                    y2={cursorCell.y * cellSize}
                    stroke={colors.accent}
                    strokeWidth={1}
                    strokeDasharray="3,3"
                    opacity={0.5}
                  />
                )}

                {tool === "polygon" && cursorCell && (
                  <>
                    <circle
                      cx={cursorCell.x * cellSize}
                      cy={cursorCell.y * cellSize}
                      r={8}
                      fill="none"
                      stroke={colors.accent}
                      strokeWidth={2}
                      opacity={0.8}
                    />
                    <circle
                      cx={cursorCell.x * cellSize}
                      cy={cursorCell.y * cellSize}
                      r={3}
                      fill={colors.accent}
                    />
                    <line
                      x1={cursorCell.x * cellSize - 12}
                      y1={cursorCell.y * cellSize}
                      x2={cursorCell.x * cellSize + 12}
                      y2={cursorCell.y * cellSize}
                      stroke={colors.accent}
                      strokeWidth={1}
                      opacity={0.5}
                    />
                    <line
                      x1={cursorCell.x * cellSize}
                      y1={cursorCell.y * cellSize - 12}
                      x2={cursorCell.x * cellSize}
                      y2={cursorCell.y * cellSize + 12}
                      stroke={colors.accent}
                      strokeWidth={1}
                      opacity={0.5}
                    />
                  </>
                )}
              </svg>
            )}

            {/* WARSTWA 5: Symbole i numery */}
            <div className="layer layer-symbols">
              {grid.map((row, y) =>
                row.map(
                  (cell, x) =>
                    (cell.symbol !== "none" || cell.number) && (
                      <div
                        key={`sym-${x}-${y}`}
                        className="symbol-overlay"
                        style={{
                          left: x * cellSize,
                          top: y * cellSize,
                          width: cellSize,
                          height: cellSize,
                          fontSize: cellSize * 0.5,
                        }}
                      >
                        {cell.symbol !== "none" && (
                          <span className="cell-symbol">
                            {SYMBOLS[cell.symbol].char}
                          </span>
                        )}
                        {cell.number && (
                          <span
                            className="cell-number"
                            style={{ fontSize: cellSize * 0.35 }}
                          >
                            {cell.number}
                          </span>
                        )}
                      </div>
                    )
                )
              )}
            </div>

            {/* WARSTWA 6: Interakcja */}
            <div
              className="layer layer-interaction"
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${gridSize.width}, ${cellSize}px)`,
                gridTemplateRows: `repeat(${gridSize.height}, ${cellSize}px)`,
                pointerEvents: tool === "delete-shape" ? "none" : "auto",
              }}
              onMouseLeave={() => setCursorCell(null)}
            >
              {grid.map((row, y) =>
                row.map((_, x) => (
                  <div
                    key={`int-${x}-${y}`}
                    className="interaction-cell"
                    style={{ width: cellSize, height: cellSize }}
                    onMouseDown={(e) => handleMouseDown(y, x, e)}
                    onMouseEnter={() => handleMouseMove(y, x)}
                    onMouseUp={() => handleMouseUp(y, x)}
                    onContextMenu={(e) => e.preventDefault()}
                  />
                ))
              )}
            </div>
          </div>
        </main>
      </div>

      <footer className="footer">
        <p>Retro Dungeon Mapper v3.3</p>
      </footer>
    </div>
  );
}
