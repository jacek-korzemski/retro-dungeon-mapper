import { useCallback } from "react";
import { useAppState } from "../Contexts/AppStateContext";
import { MapData } from "../Types/MapTypes";
import { SYMBOLS } from "../Types/SymbolTypes";
import { createCorridorPath } from "../Utils/createCorridorPath";
import { createEllipsePath } from "../Utils/createElipsePath";
import { createPolygonPath } from "../Utils/createPolygonPath";

export function useExport() {
  const { state, actions } = useAppState();
  const { gridSize, grid, vectorShapes, roomNumber, colors, showGrid, cellSize, pngCellSize, ellipseSegments } = state;

  const renderShapePathWithSize = useCallback((shape: any, size: number) => {
    switch (shape.type) {
      case 'corridor':
        return createCorridorPath(shape.startPoint!, shape.endPoint!, size);
      case 'ellipse':
        return createEllipsePath(shape.center!, shape.radiusX!, shape.radiusY!, size, ellipseSegments);
      case 'polygon':
        return createPolygonPath(shape.vertices!, size);
      default:
        return '';
    }
  }, [ellipseSegments]);

  const saveMap = useCallback(() => {
    const mapData: MapData = {
      version: '3.4',
      gridSize,
      grid,
      vectorShapes,
      roomNumber,
    };
    
    const blob = new Blob([JSON.stringify(mapData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dungeon-map.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [gridSize, grid, vectorShapes, roomNumber]);

  const loadMap = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data: MapData = JSON.parse(event.target?.result as string);
        actions.setGridSize(data.gridSize);
        actions.setGrid(data.grid);
        actions.setVectorShapes(data.vectorShapes || []);
        actions.setRoomNumber(data.roomNumber || 1);
        actions.cancelDrawing();
      } catch {
        alert('Błąd wczytywania mapy');
      }
    };
    reader.readAsText(file);
  }, [actions]);

  const exportToSVG = useCallback(() => {
    const width = gridSize.width * cellSize;
    const height = gridSize.height * cellSize;
    const c = colors;
    
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">`;
    svg += `<rect width="${width}" height="${height}" fill="${c.bg}"/>`;
    
    // Cells
    grid.forEach((row, y) => {
      row.forEach((cell, x) => {
        const cx = x * cellSize;
        const cy = y * cellSize;
        if (cell.type === 'floor') {
          svg += `<rect x="${cx}" y="${cy}" width="${cellSize}" height="${cellSize}" fill="${c.floor}"/>`;
        } else if (cell.type === 'wall') {
          svg += `<rect x="${cx}" y="${cy}" width="${cellSize}" height="${cellSize}" fill="${c.wall}"/>`;
        }
      });
    });
    
    // Vector shapes
    vectorShapes.forEach(shape => {
      const path = renderShapePathWithSize(shape, cellSize);
      const fill = shape.fillType === 'floor' ? c.floor : c.wall;
      svg += `<path d="${path}" fill="${fill}" stroke="none"/>`;
    });
    
    // Grid lines
    if (showGrid) {
      for (let x = 0; x <= gridSize.width; x++) {
        svg += `<line x1="${x * cellSize}" y1="0" x2="${x * cellSize}" y2="${height}" stroke="${c.gridLine}" stroke-width="1"/>`;
      }
      for (let y = 0; y <= gridSize.height; y++) {
        svg += `<line x1="0" y1="${y * cellSize}" x2="${width}" y2="${y * cellSize}" stroke="${c.gridLine}" stroke-width="1"/>`;
      }
    }
    
    // Symbols and numbers
    grid.forEach((row, y) => {
      row.forEach((cell, x) => {
        const cx = x * cellSize + cellSize / 2;
        const cy = y * cellSize + cellSize / 2;
        if (cell.symbol !== 'none') {
          svg += `<text x="${cx}" y="${cy}" dominant-baseline="central" text-anchor="middle" fill="${c.symbol}" font-family="monospace" font-size="${cellSize * 0.5}" font-weight="bold">${SYMBOLS[cell.symbol].char}</text>`;
        }
        if (cell.number) {
          svg += `<text x="${cx}" y="${cy}" dominant-baseline="central" text-anchor="middle" fill="${c.accent}" font-family="serif" font-size="${cellSize * 0.4}" font-weight="bold">${cell.number}</text>`;
        }
      });
    });
    
    svg += '</svg>';
    
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dungeon-map.svg';
    a.click();
    URL.revokeObjectURL(url);
  }, [gridSize, grid, vectorShapes, colors, showGrid, cellSize, renderShapePathWithSize]);

  const exportToPNG = useCallback(() => {
    const exportSize = pngCellSize;
    const width = gridSize.width * exportSize;
    const height = gridSize.height * exportSize;
    const c = colors;
    
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    
    // Background
    ctx.fillStyle = c.bg;
    ctx.fillRect(0, 0, width, height);
    
    // Cells
    grid.forEach((row, y) => {
      row.forEach((cell, x) => {
        const cx = x * exportSize;
        const cy = y * exportSize;
        if (cell.type === 'floor') {
          ctx.fillStyle = c.floor;
          ctx.fillRect(cx, cy, exportSize, exportSize);
        } else if (cell.type === 'wall') {
          ctx.fillStyle = c.wall;
          ctx.fillRect(cx, cy, exportSize, exportSize);
        }
      });
    });
    
    // Vector shapes
    vectorShapes.forEach(shape => {
      const pathString = renderShapePathWithSize(shape, exportSize);
      const path = new Path2D(pathString);
      ctx.fillStyle = shape.fillType === 'floor' ? c.floor : c.wall;
      ctx.fill(path);
    });
    
    // Grid
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
    
    // Symbols and numbers
    grid.forEach((row, y) => {
      row.forEach((cell, x) => {
        const cx = x * exportSize + exportSize / 2;
        const cy = y * exportSize + exportSize / 2;
        if (cell.symbol !== 'none') {
          ctx.font = `bold ${exportSize * 0.5}px monospace`;
          ctx.fillStyle = c.symbol;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(SYMBOLS[cell.symbol].char, cx, cy);
        }
        if (cell.number) {
          ctx.font = `bold ${exportSize * 0.4}px serif`;
          ctx.fillStyle = c.accent;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(cell.number), cx, cy);
        }
      });
    });
    
    canvas.toBlob(blob => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'dungeon-map.png';
        a.click();
        URL.revokeObjectURL(url);
      }
    }, 'image/png');
  }, [gridSize, grid, vectorShapes, colors, showGrid, pngCellSize, renderShapePathWithSize]);

  return {
    saveMap,
    loadMap,
    exportToSVG,
    exportToPNG,
    renderShapePathWithSize,
  };
}