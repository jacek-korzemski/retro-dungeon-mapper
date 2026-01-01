import React, { useRef, useEffect, useState } from "react";
import { MapData, SymbolType } from "./Types/MapTypes";
import { COLOR_LABELS, ColorScheme, DEFAULT_COLORS } from "./Types/ColorTypes";
import { SYMBOLS } from "./Types/SymbolTypes";
import { renderShapePath } from "./Utils/renderShapePath";
import "./App.css";
import { useAppState } from "./Contexts/AppStateContext";
import { useMouse } from "./Hooks/useMouse";
import { useShapes } from "./Hooks/useShapes";
import { useExport } from "./Hooks/useExport";
import { useColors } from "./Hooks/useColors";

export default function App() {
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const { state, actions } = useAppState();
  const {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleGlobalMouseUp,
  } = useMouse();
  const { handleDeleteShape, finishPolygon, cancelPolygon } = useShapes();
  const { exportToSVG, exportToPNG, saveMap, loadMap } = useExport();
  const { exportColors, importColors } = useColors();

  const deleteSelectedShape = () => {
    if (selectedShapeId) {
      actions.setVectorShapes((prev) =>
        prev.filter((s) => s.id !== selectedShapeId)
      );
      setSelectedShapeId(null);
    }
  };

  const isVectorTool =
    state.tool === "corridor" ||
    state.tool === "ellipse" ||
    state.tool === "polygon";
  const canvasWidth = state.gridSize.width * state.cellSize;
  const canvasHeight = state.gridSize.height * state.cellSize;

  useEffect(() => {
    localStorage.setItem("dungeonMapperColors", JSON.stringify(state.colors));
  }, [state.colors]);

  const updateColor = (key: keyof ColorScheme, value: string) => {
    actions.setColors((prev) => ({ ...prev, [key]: value }));
  };

  const resetColors = () => {
    if (window.confirm("Przywrócić domyślne kolory?")) {
      actions.setColors(DEFAULT_COLORS);
    }
  };

  useEffect(() => {
    if (state.tool !== "delete-shape") {
      actions.setHoveredShapeId(null);
    }
  }, [state.tool]);

  return (
    <div
      className={`app`}
      onMouseUp={handleGlobalMouseUp}
      onMouseLeave={handleGlobalMouseUp}
      onKeyDown={(e) => {
        if (e.key === "Delete" && selectedShapeId) deleteSelectedShape();
        if (e.key === "Escape") {
          actions.setShapeStart(null);
          actions.setPreviewShape(null);
          actions.setPolygonVertices([]);
          actions.setHoveredShapeId(null);
        }
      }}
      tabIndex={0}
      style={
        {
          "--bg-primary": state.colors.bg,
          "--bg-secondary": state.colors.floor,
          "--bg-tertiary": state.colors.border,
          "--color-floor": state.colors.floor,
          "--color-wall": state.colors.wall,
          "--color-empty": state.colors.empty,
          "--color-text": state.colors.text,
          "--color-accent": state.colors.accent,
          "--color-border": state.colors.border,
          "--color-symbol": state.colors.symbol,
          "--color-grid-line": state.colors.gridLine,
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
                  className={`tool-btn ${
                    state.tool === "floor" ? "active" : ""
                  }`}
                  onClick={() => actions.setTool("floor")}
                >
                  ▢ Podłoga
                </button>
                <button
                  className={`tool-btn ${
                    state.tool === "wall" ? "active" : ""
                  }`}
                  onClick={() => actions.setTool("wall")}
                >
                  ▮ Ściana
                </button>
                <button
                  className={`tool-btn ${
                    state.tool === "erase" ? "active" : ""
                  }`}
                  onClick={() => actions.setTool("erase")}
                >
                  ✕ Wymaż
                </button>
                <button
                  className={`tool-btn ${
                    state.tool === "symbol" ? "active" : ""
                  }`}
                  onClick={() => actions.setTool("symbol")}
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
                  className={`tool-btn ${
                    state.tool === "rect" ? "active" : ""
                  }`}
                  onClick={() => actions.setTool("rect")}
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
                  className={`tool-btn ${
                    state.tool === "corridor" ? "active" : ""
                  }`}
                  onClick={() => {
                    actions.setTool("corridor");
                    actions.setShapeStart(null);
                    actions.setPreviewShape(null);
                  }}
                >
                  / Korytarz
                </button>
                <button
                  className={`tool-btn ${
                    state.tool === "ellipse" ? "active" : ""
                  }`}
                  onClick={() => {
                    actions.setTool("ellipse");
                    actions.setShapeStart(null);
                    actions.setPreviewShape(null);
                  }}
                >
                  ◯ Elipsa/Okrąg
                </button>
                <button
                  className={`tool-btn ${
                    state.tool === "polygon" ? "active" : ""
                  }`}
                  onClick={() => {
                    actions.setTool("polygon");
                    actions.setPolygonVertices([]);
                  }}
                >
                  📐 Wielokąt
                </button>
                <button
                  className={`tool-btn ${
                    state.tool === "delete-shape" ? "active" : ""
                  }`}
                  onClick={() => actions.setTool("delete-shape")}
                >
                  🗑️ Usuń kształt
                </button>
              </div>

              {/* Status rysowania */}
              {state.shapeStart &&
                (state.tool === "corridor" || state.tool === "ellipse") && (
                  <div className="drawing-status">
                    📍 Kliknij aby zakończyć (PPM anuluje)
                  </div>
                )}

              {(isVectorTool ||
                state.tool === "delete-shape" ||
                state.tool === "rect") && (
                <div className="shape-options">
                  {state.tool !== "delete-shape" && (
                    <>
                      <label className="option-label">Typ wypełnienia:</label>
                      <div className="radio-group">
                        <label>
                          <input
                            type="radio"
                            checked={state.shapeFillType === "floor"}
                            onChange={() => actions.setShapeFillType("floor")}
                          />
                          Podłoga
                        </label>
                        <label>
                          <input
                            type="radio"
                            checked={state.shapeFillType === "wall"}
                            onChange={() => actions.setShapeFillType("wall")}
                          />
                          Ściana
                        </label>
                      </div>
                    </>
                  )}

                  {state.tool === "corridor" && (
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={state.snapAngle}
                        onChange={(e) => actions.setSnapAngle(e.target.checked)}
                      />
                      Snap do 45°
                    </label>
                  )}

                  {state.tool === "ellipse" && (
                    <>
                      <label className="option-label">Gładkość:</label>
                      <div className="slider-row">
                        <input
                          type="range"
                          min="8"
                          max="64"
                          step="4"
                          value={state.ellipseSegments}
                          onChange={(e) =>
                            actions.setEllipseSegments(parseInt(e.target.value))
                          }
                        />
                        <span>{state.ellipseSegments}</span>
                      </div>
                    </>
                  )}

                  {state.tool === "polygon" && (
                    <div className="polygon-controls">
                      <span className="vertex-count">
                        Punkty: {state.polygonVertices.length}
                      </span>
                      <div className="polygon-buttons">
                        <button
                          className="tool-btn small"
                          onClick={finishPolygon}
                          disabled={state.polygonVertices.length < 3}
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

                  {state.tool === "delete-shape" && (
                    <p className="hint">Kliknij na kształt aby go usunąć</p>
                  )}
                </div>
              )}

              <div className="shape-count">
                Kształtów: {state.vectorShapes.length}
                {state.vectorShapes.length > 0 && (
                  <button
                    className="tool-btn small danger"
                    onClick={actions.deleteAllShapes}
                  >
                    Usuń wszystkie
                  </button>
                )}
              </div>
            </section>

            {/* Symbole */}
            {state.tool === "symbol" && (
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
                          state.selectedSymbol === key ? "active" : ""
                        }`}
                        onClick={() =>
                          actions.setSelectedSymbol(key as SymbolType)
                        }
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
                  Następny: <strong>{state.roomNumber}</strong>
                </span>
                <button
                  className="tool-btn small"
                  onClick={() => actions.setRoomNumber(1)}
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
                  value={state.cellSize}
                  onChange={(e) =>
                    actions.setCellSize(parseInt(e.target.value))
                  }
                />
                <span>{state.cellSize}px</span>
              </div>
              <div className="zoom-buttons">
                <button
                  className="tool-btn small"
                  onClick={() =>
                    actions.setCellSize(Math.max(16, state.cellSize - 4))
                  }
                >
                  −
                </button>
                <button
                  className="tool-btn small"
                  onClick={() => actions.setCellSize(28)}
                >
                  Reset
                </button>
                <button
                  className="tool-btn small"
                  onClick={() =>
                    actions.setCellSize(Math.min(48, state.cellSize + 4))
                  }
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
                onClick={() =>
                  actions.setShowColorEditor(!state.showColorEditor)
                }
              >
                {state.showColorEditor ? "▲ Zwiń" : "▼ Edytuj kolory"}
              </button>

              {state.showColorEditor && (
                <div className="color-editor">
                  {(Object.keys(COLOR_LABELS) as Array<keyof ColorScheme>).map(
                    (key) => (
                      <div key={key} className="color-row">
                        <label>{COLOR_LABELS[key]}</label>
                        <input
                          type="color"
                          value={
                            state.colors[key].startsWith("rgba")
                              ? "#7faacc"
                              : state.colors[key]
                          }
                          onChange={(e) => updateColor(key, e.target.value)}
                        />
                        <input
                          type="text"
                          value={state.colors[key]}
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
                        onChange={() => importColors}
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
                    value={state.gridSize.width}
                    min={5}
                    max={100}
                    onChange={(e) =>
                      actions.resizeGrid(
                        parseInt(e.target.value) || 30,
                        state.gridSize.height
                      )
                    }
                  />
                </label>
                <label>
                  Wys:{" "}
                  <input
                    type="number"
                    value={state.gridSize.height}
                    min={5}
                    max={100}
                    onChange={(e) =>
                      actions.resizeGrid(
                        state.gridSize.width,
                        parseInt(e.target.value) || 25
                      )
                    }
                  />
                </label>
              </div>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={state.showGrid}
                  onChange={(e) => actions.setShowGrid(e.target.checked)}
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
                  <input
                    type="file"
                    accept=".json"
                    onChange={() => loadMap}
                    hidden
                  />
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
                    value={state.pngCellSize}
                    onChange={(e) =>
                      actions.setPngCellSize(parseInt(e.target.value))
                    }
                  />
                  <span>{state.pngCellSize}px</span>
                </div>
                <p className="hint">
                  {state.gridSize.width * state.pngCellSize} x{" "}
                  {state.gridSize.height * state.pngCellSize}px
                </p>
                <button className="action-btn" onClick={exportToPNG}>
                  🖼️ Eksportuj PNG
                </button>
              </div>

              <button className="action-btn danger" onClick={actions.clearMap}>
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
                  <b>Wielokąt:</b> klik x N → Zakończ
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
                gridTemplateColumns: `repeat(${state.gridSize.width}, ${state.cellSize}px)`,
                gridTemplateRows: `repeat(${state.gridSize.height}, ${state.cellSize}px)`,
              }}
            >
              {state.grid.map((row, y) =>
                row.map((cell, x) => (
                  <div
                    key={`${x}-${y}`}
                    className={`cell ${cell.type}`}
                    style={{ width: state.cellSize, height: state.cellSize }}
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
                pointerEvents: state.tool === "delete-shape" ? "auto" : "none",
                zIndex: state.tool === "delete-shape" ? 200 : 10,
              }}
            >
              {state.vectorShapes.map((shape, index) => (
                <path
                  key={shape.id}
                  d={renderShapePath(
                    shape,
                    state.cellSize,
                    state.ellipseSegments
                  )}
                  fill={
                    shape.fillType === "floor"
                      ? state.colors.floor
                      : state.colors.wall
                  }
                  stroke={
                    state.hoveredShapeId === shape.id
                      ? state.colors.accent
                      : "none"
                  }
                  strokeWidth={state.hoveredShapeId === shape.id ? 3 : 0}
                  className={`vector-shape ${
                    state.hoveredShapeId === shape.id ? "hovered" : ""
                  }`}
                  style={{
                    cursor:
                      state.tool === "delete-shape" ? "pointer" : "default",
                  }}
                  onMouseEnter={() => {
                    if (state.tool === "delete-shape")
                      actions.setHoveredShapeId(shape.id);
                  }}
                  onMouseLeave={() => {
                    if (state.tool === "delete-shape")
                      actions.setHoveredShapeId(null);
                  }}
                  onClick={(e) => {
                    if (state.tool === "delete-shape") {
                      e.stopPropagation();
                      handleDeleteShape(shape.id);
                    }
                  }}
                />
              ))}

              {state.previewShape && (
                <path
                  d={renderShapePath(
                    state.previewShape,
                    state.cellSize,
                    state.ellipseSegments
                  )}
                  fill={
                    state.previewShape.fillType === "floor"
                      ? state.colors.floor
                      : state.colors.wall
                  }
                  stroke={state.colors.accent}
                  strokeWidth={2}
                  strokeDasharray="5,5"
                  opacity={0.7}
                />
              )}
            </svg>

            {/* WARSTWA 3: Siatka */}
            {state.showGrid && (
              <svg
                className="layer layer-grid"
                width={canvasWidth}
                height={canvasHeight}
              >
                {Array.from({ length: state.gridSize.width + 1 }, (_, i) => (
                  <line
                    key={`v${i}`}
                    x1={i * state.cellSize}
                    y1={0}
                    x2={i * state.cellSize}
                    y2={canvasHeight}
                    stroke={state.colors.gridLine}
                    strokeWidth={1}
                  />
                ))}
                {Array.from({ length: state.gridSize.height + 1 }, (_, i) => (
                  <line
                    key={`h${i}`}
                    x1={0}
                    y1={i * state.cellSize}
                    x2={canvasWidth}
                    y2={i * state.cellSize}
                    stroke={state.colors.gridLine}
                    strokeWidth={1}
                  />
                ))}
              </svg>
            )}

            {/* WARSTWA 4: Podgląd wielokąta + narożnik */}
            {(state.polygonVertices.length > 0 ||
              (state.tool === "polygon" && state.cursorCell)) && (
              <svg
                className="layer layer-polygon-preview"
                width={canvasWidth}
                height={canvasHeight}
              >
                {state.polygonVertices.length > 0 && (
                  <polyline
                    points={state.polygonVertices
                      .map(
                        (v) => `${v.x * state.cellSize},${v.y * state.cellSize}`
                      )
                      .join(" ")}
                    fill="none"
                    stroke={state.colors.accent}
                    strokeWidth={2}
                    strokeDasharray="5,5"
                  />
                )}

                {state.polygonVertices.map((v, i) => (
                  <circle
                    key={i}
                    cx={v.x * state.cellSize}
                    cy={v.y * state.cellSize}
                    r={6}
                    fill={state.colors.accent}
                    stroke={state.colors.bg}
                    strokeWidth={2}
                  />
                ))}

                {state.polygonVertices.length > 0 && state.cursorCell && (
                  <line
                    x1={
                      state.polygonVertices[state.polygonVertices.length - 1]
                        .x * state.cellSize
                    }
                    y1={
                      state.polygonVertices[state.polygonVertices.length - 1]
                        .y * state.cellSize
                    }
                    x2={state.cursorCell.x * state.cellSize}
                    y2={state.cursorCell.y * state.cellSize}
                    stroke={state.colors.accent}
                    strokeWidth={1}
                    strokeDasharray="3,3"
                    opacity={0.5}
                  />
                )}

                {state.tool === "polygon" && state.cursorCell && (
                  <>
                    <circle
                      cx={state.cursorCell.x * state.cellSize}
                      cy={state.cursorCell.y * state.cellSize}
                      r={8}
                      fill="none"
                      stroke={state.colors.accent}
                      strokeWidth={2}
                      opacity={0.8}
                    />
                    <circle
                      cx={state.cursorCell.x * state.cellSize}
                      cy={state.cursorCell.y * state.cellSize}
                      r={3}
                      fill={state.colors.accent}
                    />
                    <line
                      x1={state.cursorCell.x * state.cellSize - 12}
                      y1={state.cursorCell.y * state.cellSize}
                      x2={state.cursorCell.x * state.cellSize + 12}
                      y2={state.cursorCell.y * state.cellSize}
                      stroke={state.colors.accent}
                      strokeWidth={1}
                      opacity={0.5}
                    />
                    <line
                      x1={state.cursorCell.x * state.cellSize}
                      y1={state.cursorCell.y * state.cellSize - 12}
                      x2={state.cursorCell.x * state.cellSize}
                      y2={state.cursorCell.y * state.cellSize + 12}
                      stroke={state.colors.accent}
                      strokeWidth={1}
                      opacity={0.5}
                    />
                  </>
                )}
              </svg>
            )}

            {/* WARSTWA 5: Symbole i numery */}
            <div className="layer layer-symbols">
              {state.grid.map((row, y) =>
                row.map(
                  (cell, x) =>
                    (cell.symbol !== "none" || cell.number) && (
                      <div
                        key={`sym-${x}-${y}`}
                        className="symbol-overlay"
                        style={{
                          left: x * state.cellSize,
                          top: y * state.cellSize,
                          width: state.cellSize,
                          height: state.cellSize,
                          fontSize: state.cellSize * 0.5,
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
                            style={{ fontSize: state.cellSize * 0.35 }}
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
                gridTemplateColumns: `repeat(${state.gridSize.width}, ${state.cellSize}px)`,
                gridTemplateRows: `repeat(${state.gridSize.height}, ${state.cellSize}px)`,
                pointerEvents: state.tool === "delete-shape" ? "none" : "auto",
              }}
              onMouseLeave={() => actions.setCursorCell(null)}
            >
              {state.grid.map((row, y) =>
                row.map((_, x) => (
                  <div
                    key={`int-${x}-${y}`}
                    className="interaction-cell"
                    style={{ width: state.cellSize, height: state.cellSize }}
                    onMouseDown={(e) => handleMouseDown(y, x, e.button)}
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
