import { useCallback } from "react";
import { useAppState } from "../Contexts/AppStateContext";
import { generateId } from "../Utils/generateId";
import { getRectPoints } from "../Utils/getRectPoints";
import { snapTo45Degrees } from "../Utils/snapTo45Degrees";

export function useMouse() {
  const { state, actions } = useAppState();

  const handleCellAction = useCallback((row: number, col: number) => {
    actions.setGrid(prev => {
      const newGrid = prev.map(r => r.map(c => ({ ...c })));
      const cell = newGrid[row][col];

      switch (state.tool) {
        case 'floor':
          cell.type = 'floor';
          break;
        case 'wall':
          cell.type = 'wall';
          break;
        case 'erase':
          cell.type = 'empty';
          cell.symbol = 'none';
          cell.number = undefined;
          break;
        case 'symbol':
          cell.symbol = cell.symbol === state.selectedSymbol ? 'none' : state.selectedSymbol;
          break;
      }
      return newGrid;
    });
  }, [state.tool, state.selectedSymbol, actions]);

  const addRoomNumber = useCallback((row: number, col: number) => {
    actions.setGrid(prev => {
      const newGrid = prev.map(r => r.map(c => ({ ...c })));
      const cell = newGrid[row][col];
      if (cell.number) {
        cell.number = undefined;
      } else {
        cell.number = state.roomNumber;
        actions.setRoomNumber(state.roomNumber + 1);
      }
      return newGrid;
    });
  }, [state.roomNumber, actions]);

  const finishVectorShape = useCallback((endPoint: { x: number; y: number }) => {
    if (!state.shapeStart) return;
    
    let finalEndPoint = endPoint;
    if (state.tool === 'corridor' && state.snapAngle) {
      finalEndPoint = snapTo45Degrees(state.shapeStart, finalEndPoint);
    }
    
    if (state.tool === 'corridor') {
      actions.addVectorShape({
        id: generateId(),
        type: 'corridor',
        fillType: state.shapeFillType,
        startPoint: state.shapeStart,
        endPoint: finalEndPoint,
      });
    } else if (state.tool === 'ellipse') {
      const radiusX = Math.abs(finalEndPoint.x - state.shapeStart.x);
      const radiusY = Math.abs(finalEndPoint.y - state.shapeStart.y);
      if (radiusX > 0 || radiusY > 0) {
        actions.addVectorShape({
          id: generateId(),
          type: 'ellipse',
          fillType: state.shapeFillType,
          center: state.shapeStart,
          radiusX,
          radiusY,
        });
      }
    }
    
    actions.setShapeStart(null);
    actions.setPreviewShape(null);
  }, [state.shapeStart, state.tool, state.snapAngle, state.shapeFillType, actions]);

  const handleMouseDown = useCallback((row: number, col: number, button: number) => {
    if (button === 2) {
      if (state.shapeStart || state.polygonVertices.length > 0) {
        actions.cancelDrawing();
        return;
      }
      addRoomNumber(row, col);
      return;
    }

    const point = { x: col, y: row };

    switch (state.tool) {
      case 'floor':
      case 'wall':
      case 'erase':
      case 'symbol':
        actions.setIsDrawing(true);
        handleCellAction(row, col);
        break;
        
      case 'rect':
        actions.setShapeStart(point);
        actions.setIsDrawing(true);
        break;
        
      case 'corridor':
      case 'ellipse':
        if (!state.shapeStart) {
          actions.setShapeStart(point);
        } else {
          finishVectorShape(point);
        }
        break;
        
      case 'polygon':
        actions.setPolygonVertices(prev => [...prev, point]);
        break;
    }
  }, [state.tool, state.shapeStart, state.polygonVertices, actions, handleCellAction, addRoomNumber, finishVectorShape]);

  const handleMouseMove = useCallback((row: number, col: number) => {
    const point = { x: col, y: row };
    actions.setCursorCell(point);
    
    if (state.isDrawing && ['floor', 'wall', 'erase', 'symbol'].includes(state.tool)) {
      handleCellAction(row, col);
      return;
    }
    
    if (state.shapeStart && (state.tool === 'corridor' || state.tool === 'ellipse')) {
      let endPoint = point;
      
      if (state.tool === 'corridor' && state.snapAngle) {
        endPoint = snapTo45Degrees(state.shapeStart, endPoint);
      }
      
      if (state.tool === 'corridor') {
        actions.setPreviewShape({
          id: 'preview',
          type: 'corridor',
          fillType: state.shapeFillType,
          startPoint: state.shapeStart,
          endPoint,
        });
      } else {
        actions.setPreviewShape({
          id: 'preview',
          type: 'ellipse',
          fillType: state.shapeFillType,
          center: state.shapeStart,
          radiusX: Math.abs(endPoint.x - state.shapeStart.x),
          radiusY: Math.abs(endPoint.y - state.shapeStart.y),
        });
      }
    }
  }, [state.isDrawing, state.tool, state.shapeStart, state.snapAngle, state.shapeFillType, actions, handleCellAction]);

  const handleMouseUp = useCallback((row: number, col: number) => {
    if (state.isDrawing && state.tool === 'rect' && state.shapeStart) {
      const points = getRectPoints(state.shapeStart.x, state.shapeStart.y, col, row);
      actions.setGrid(prev => {
        const newGrid = prev.map(r => r.map(c => ({ ...c })));
        points.forEach(({ x, y }) => {
          if (y >= 0 && y < newGrid.length && x >= 0 && x < newGrid[0].length) {
            newGrid[y][x].type = state.shapeFillType === 'floor' ? 'floor' : 'wall';
          }
        });
        return newGrid;
      });
    }

    actions.setIsDrawing(false);
    if (state.tool === 'rect') {
      actions.setShapeStart(null);
    }
  }, [state.isDrawing, state.tool, state.shapeStart, state.shapeFillType, actions]);

  const handleMouseLeave = useCallback(() => {
    actions.setCursorCell(null);
  }, [actions]);

  const handleGlobalMouseUp = useCallback(() => {
    actions.setIsDrawing(false);
    if (state.tool === 'rect') {
      actions.setShapeStart(null);
      actions.setPreviewShape(null);
    }
  }, [state.tool, actions]);

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    handleGlobalMouseUp,
  };
}