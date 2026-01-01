import { useAppState } from "../Contexts/AppStateContext";
import { useColors } from "../Hooks/useColors";
import { useExport } from "../Hooks/useExport";
import { useShapes } from "../Hooks/useShapes";
import { COLOR_LABELS, ColorScheme } from "../Types/ColorTypes";
import { SymbolType } from "../Types/MapTypes";
import { SYMBOLS } from "../Types/SymbolTypes";

export function Toolbar() {
  const { state, actions } = useAppState();
  const { finishPolygon, cancelPolygon } = useShapes();
  const { saveMap, loadMap, exportToSVG, exportToPNG } = useExport();
  const { exportColors, importColors } = useColors();

  const isVectorTool =
    state.tool === "corridor" ||
    state.tool === "ellipse" ||
    state.tool === "polygon";
  const isDrawingShape = state.shapeStart !== null;

  const handleLoadMap = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      loadMap(file);
      e.target.value = "";
    }
  };

  const handleImportColors = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      importColors(file);
      e.target.value = "";
    }
  };

  return (
    <aside className="toolbar">
      <div className="toolbar-scroll">
        {/* ===== PĘDZEL ===== */}
        <section className="tool-section">
          <h3>🖌️ Pędzel</h3>
          <div className="tool-buttons">
            <button
              className={`tool-btn ${state.tool === "floor" ? "active" : ""}`}
              onClick={() => actions.setTool("floor")}
            >
              ▢ Podłoga
            </button>
            <button
              className={`tool-btn ${state.tool === "wall" ? "active" : ""}`}
              onClick={() => actions.setTool("wall")}
            >
              ▮ Ściana
            </button>
            <button
              className={`tool-btn ${state.tool === "erase" ? "active" : ""}`}
              onClick={() => actions.setTool("erase")}
            >
              ✕ Wymaż
            </button>
            <button
              className={`tool-btn ${state.tool === "symbol" ? "active" : ""}`}
              onClick={() => actions.setTool("symbol")}
            >
              ★ Symbol
            </button>
          </div>
        </section>

        {/* ===== KSZTAŁTY SIATKOWE ===== */}
        <section className="tool-section">
          <h3>▦ Kształty (siatka)</h3>
          <div className="tool-buttons">
            <button
              className={`tool-btn ${state.tool === "rect" ? "active" : ""}`}
              onClick={() => actions.setTool("rect")}
            >
              ▭ Prostokąt
            </button>
          </div>
        </section>

        {/* ===== KSZTAŁTY WEKTOROWE ===== */}
        <section className="tool-section highlight">
          <h3>✨ Kształty wektorowe</h3>
          <div className="tool-buttons">
            <button
              className={`tool-btn ${
                state.tool === "corridor" ? "active" : ""
              }`}
              onClick={() => actions.setTool("corridor")}
            >
              ╱ Korytarz
            </button>
            <button
              className={`tool-btn ${state.tool === "ellipse" ? "active" : ""}`}
              onClick={() => actions.setTool("ellipse")}
            >
              ◯ Elipsa/Okrąg
            </button>
            <button
              className={`tool-btn ${state.tool === "polygon" ? "active" : ""}`}
              onClick={() => actions.setTool("polygon")}
            >
              ⬡ Wielokąt
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
          {isDrawingShape &&
            (state.tool === "corridor" || state.tool === "ellipse") && (
              <div className="drawing-status">
                📍 Kliknij aby zakończyć (PPM anuluje)
              </div>
            )}

          {/* Opcje kształtów */}
          {(isVectorTool ||
            state.tool === "delete-shape" ||
            state.tool === "rect") && (
            <div className="shape-options">
              {/* Typ wypełnienia */}
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

              {/* Opcje korytarza */}
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

              {/* Opcje elipsy */}
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

              {/* Opcje wielokąta */}
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
                    <button className="tool-btn small" onClick={cancelPolygon}>
                      ✕ Anuluj
                    </button>
                  </div>
                </div>
              )}

              {/* Info o usuwaniu */}
              {state.tool === "delete-shape" && (
                <p className="hint">Kliknij na kształt aby go usunąć</p>
              )}
            </div>
          )}

          {/* Licznik kształtów */}
          <div className="shape-count">
            <span>Kształtów: {state.vectorShapes.length}</span>
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

        {/* ===== SYMBOLE ===== */}
        {state.tool === "symbol" && (
          <section className="tool-section">
            <h3>📍 Symbole</h3>
            <p className="hint">Można stawiać wszędzie</p>
            <div className="symbol-grid">
              {(
                Object.entries(SYMBOLS) as [
                  SymbolType,
                  { char: string; name: string }
                ][]
              )
                .filter(([key]) => key !== "none")
                .map(([key, { char, name }]) => (
                  <button
                    key={key}
                    className={`symbol-btn ${
                      state.selectedSymbol === key ? "active" : ""
                    }`}
                    onClick={() => actions.setSelectedSymbol(key)}
                    title={name}
                  >
                    <span className="symbol-char">{char}</span>
                    <span className="symbol-name">{name}</span>
                  </button>
                ))}
            </div>
          </section>
        )}

        {/* ===== NUMERACJA ===== */}
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

        {/* ===== ZOOM ===== */}
        <section className="tool-section">
          <h3>🔍 Zoom</h3>
          <div className="slider-row">
            <input
              type="range"
              min="16"
              max="48"
              value={state.cellSize}
              onChange={(e) => actions.setCellSize(parseInt(e.target.value))}
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

        {/* ===== KOLORY ===== */}
        <section className="tool-section">
          <h3>🎨 Kolory</h3>
          <button
            className="tool-btn"
            onClick={() => actions.setShowColorEditor(!state.showColorEditor)}
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
                      onChange={(e) => actions.updateColor(key, e.target.value)}
                    />
                    <input
                      type="text"
                      value={state.colors[key]}
                      onChange={(e) => actions.updateColor(key, e.target.value)}
                      className="color-text-input"
                    />
                  </div>
                )
              )}

              <div className="color-actions">
                <button
                  className="tool-btn small"
                  onClick={actions.resetColors}
                >
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
                    onChange={handleImportColors}
                    hidden
                  />
                </label>
              </div>
            </div>
          )}
        </section>

        {/* ===== ROZMIAR SIATKI ===== */}
        <section className="tool-section">
          <h3>📐 Rozmiar siatki</h3>
          <div className="size-controls">
            <label>
              Szer:
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
              Wys:
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

        {/* ===== ZAPIS / EKSPORT ===== */}
        <section className="tool-section">
          <h3>💾 Zapis</h3>

          {/* Zapis/wczytaj mapę */}
          <div className="save-load-row">
            <button className="action-btn" onClick={saveMap}>
              📁 Zapisz mapę (.json)
            </button>
            <label className="action-btn file-input-label">
              📂 Wczytaj mapę
              <input
                type="file"
                accept=".json"
                onChange={handleLoadMap}
                hidden
              />
            </label>
          </div>

          <div className="export-divider">Eksport grafiki</div>

          {/* SVG */}
          <button className="action-btn" onClick={exportToSVG}>
            📥 Eksportuj SVG
          </button>

          {/* PNG */}
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
              {state.gridSize.width * state.pngCellSize} ×{" "}
              {state.gridSize.height * state.pngCellSize}px
            </p>
            <button className="action-btn" onClick={exportToPNG}>
              🖼️ Eksportuj PNG
            </button>
          </div>

          {/* Wyczyść */}
          <button className="action-btn danger" onClick={actions.clearMap}>
            🗑️ Wyczyść mapę
          </button>
        </section>

        {/* ===== POMOC ===== */}
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
  );
}
