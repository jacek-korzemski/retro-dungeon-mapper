import { useCallback } from "react";
import { useAppState } from "../Contexts/AppStateContext";
import { generateId } from "../Utils/generateId";

export function useShapes() {
  const { state, actions } = useAppState();
  const { polygonVertices, shapeFillType } = state;

  const finishPolygon = useCallback(() => {
    if (polygonVertices.length >= 3) {
      actions.addVectorShape({
        id: generateId(),
        type: 'polygon',
        fillType: shapeFillType,
        vertices: [...polygonVertices],
      });
    }
    actions.setPolygonVertices([]);
  }, [polygonVertices, shapeFillType, actions]);

  const cancelPolygon = useCallback(() => {
    actions.setPolygonVertices([]);
  }, [actions]);

  const handleDeleteShape = useCallback((shapeId: string) => {
    actions.deleteVectorShape(shapeId);
  }, [actions]);

  const handleShapeHover = useCallback((shapeId: string | null) => {
    if (state.tool === 'delete-shape') {
      actions.setHoveredShapeId(shapeId);
    }
  }, [state.tool, actions]);

  return {
    finishPolygon,
    cancelPolygon,
    handleDeleteShape,
    handleShapeHover,
  };
}