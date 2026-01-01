import { useAppState } from "../Contexts/AppStateContext";
import { useExport } from "../Hooks/useExport";
import { useMouse } from "../Hooks/useMouse";
import { SYMBOLS } from "../Types/SymbolTypes";

// components/Canvas/Canvas.tsx
export function Canvas() {
  const { state, actions } = useAppState();
  const { handleMouseDown, handleMouseMove, handleMouseUp, handleMouseLeave } =
    useMouse();
  const { renderShapePathWithSize } = useExport();

  const canvasWidth = state.gridSize.width * state.cellSize;
  const canvasHeight = state.gridSize.height * state.cellSize;

  return (
    <main className="canvas-area">
      <div
        className="canvas-wrapper"
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
                key={`cell-${x}-${y}`}
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
          {/* Istniejące kształty */}
          {state.vectorShapes.map((shape) => (
            <path
              key={shape.id}
              d={renderShapePathWithSize(shape, state.cellSize)}
              fill={
                shape.fillType === "floor"
                  ? state.colors.floor
                  : state.colors.wall
              }
              stroke={
                state.hoveredShapeId === shape.id ? state.colors.accent : "none"
              }
              strokeWidth={state.hoveredShapeId === shape.id ? 3 : 0}
              className={`vector-shape ${
                state.hoveredShapeId === shape.id ? "hovered" : ""
              }`}
              style={{
                cursor: state.tool === "delete-shape" ? "pointer" : "default",
              }}
              onMouseEnter={() => {
                if (state.tool === "delete-shape") {
                  actions.setHoveredShapeId(shape.id);
                }
              }}
              onMouseLeave={() => {
                if (state.tool === "delete-shape") {
                  actions.setHoveredShapeId(null);
                }
              }}
              onClick={(e) => {
                if (state.tool === "delete-shape") {
                  e.stopPropagation();
                  actions.deleteVectorShape(shape.id);
                }
              }}
            />
          ))}

          {/* Podgląd rysowanego kształtu */}
          {state.previewShape && (
            <path
              d={renderShapePathWithSize(state.previewShape, state.cellSize)}
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
            {/* Linie pionowe */}
            {Array.from({ length: state.gridSize.width + 1 }, (_, i) => (
              <line
                key={`grid-v-${i}`}
                x1={i * state.cellSize}
                y1={0}
                x2={i * state.cellSize}
                y2={canvasHeight}
                stroke={state.colors.gridLine}
                strokeWidth={1}
              />
            ))}
            {/* Linie poziome */}
            {Array.from({ length: state.gridSize.height + 1 }, (_, i) => (
              <line
                key={`grid-h-${i}`}
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

        {/* WARSTWA 4: Podgląd wielokąta + celownik narożnika */}
        {(state.polygonVertices.length > 0 ||
          (state.tool === "polygon" && state.cursorCell)) && (
          <svg
            className="layer layer-polygon-preview"
            width={canvasWidth}
            height={canvasHeight}
          >
            {/* Linie łączące wierzchołki */}
            {state.polygonVertices.length > 0 && (
              <polyline
                points={state.polygonVertices
                  .map((v) => `${v.x * state.cellSize},${v.y * state.cellSize}`)
                  .join(" ")}
                fill="none"
                stroke={state.colors.accent}
                strokeWidth={2}
                strokeDasharray="5,5"
              />
            )}

            {/* Wierzchołki */}
            {state.polygonVertices.map((v, i) => (
              <circle
                key={`vertex-${i}`}
                cx={v.x * state.cellSize}
                cy={v.y * state.cellSize}
                r={6}
                fill={state.colors.accent}
                stroke={state.colors.bg}
                strokeWidth={2}
              />
            ))}

            {/* Linia od ostatniego wierzchołka do kursora */}
            {state.polygonVertices.length > 0 && state.cursorCell && (
              <line
                x1={
                  state.polygonVertices[state.polygonVertices.length - 1].x *
                  state.cellSize
                }
                y1={
                  state.polygonVertices[state.polygonVertices.length - 1].y *
                  state.cellSize
                }
                x2={state.cursorCell.x * state.cellSize}
                y2={state.cursorCell.y * state.cellSize}
                stroke={state.colors.accent}
                strokeWidth={1}
                strokeDasharray="3,3"
                opacity={0.5}
              />
            )}

            {/* Celownik narożnika */}
            {state.tool === "polygon" && state.cursorCell && (
              <>
                {/* Zewnętrzny okrąg */}
                <circle
                  cx={state.cursorCell.x * state.cellSize}
                  cy={state.cursorCell.y * state.cellSize}
                  r={8}
                  fill="none"
                  stroke={state.colors.accent}
                  strokeWidth={2}
                  opacity={0.8}
                />
                {/* Wewnętrzny punkt */}
                <circle
                  cx={state.cursorCell.x * state.cellSize}
                  cy={state.cursorCell.y * state.cellSize}
                  r={3}
                  fill={state.colors.accent}
                />
                {/* Krzyżyk poziomy */}
                <line
                  x1={state.cursorCell.x * state.cellSize - 12}
                  y1={state.cursorCell.y * state.cellSize}
                  x2={state.cursorCell.x * state.cellSize + 12}
                  y2={state.cursorCell.y * state.cellSize}
                  stroke={state.colors.accent}
                  strokeWidth={1}
                  opacity={0.5}
                />
                {/* Krzyżyk pionowy */}
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
            row.map((cell, x) => {
              if (cell.symbol === "none" && !cell.number) return null;

              return (
                <div
                  key={`symbol-${x}-${y}`}
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
              );
            })
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
          onMouseLeave={handleMouseLeave}
        >
          {state.grid.map((row, y) =>
            row.map((_, x) => (
              <div
                key={`interaction-${x}-${y}`}
                className="interaction-cell"
                style={{ width: state.cellSize, height: state.cellSize }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleMouseDown(y, x, e.button);
                }}
                onMouseEnter={() => handleMouseMove(y, x)}
                onMouseUp={() => handleMouseUp(y, x)}
                onContextMenu={(e) => e.preventDefault()}
              />
            ))
          )}
        </div>
      </div>
    </main>
  );
}
