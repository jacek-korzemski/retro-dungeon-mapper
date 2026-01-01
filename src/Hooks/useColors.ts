import { useCallback } from "react";
import { useAppState } from "../Contexts/AppStateContext";
import { ColorScheme } from "../Types/ColorTypes";

export function useColors() {
  const { state, actions } = useAppState();
  const { colors } = state;

  const exportColors = useCallback(() => {
    const blob = new Blob([JSON.stringify(colors, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dungeon-colors.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [colors]);

  const importColors = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string) as Partial<ColorScheme>;
        actions.setColors(prev => ({ ...prev, ...imported }));
      } catch {
        alert('Błąd wczytywania pliku kolorów');
      }
    };
    reader.readAsText(file);
  }, [actions]);

  return {
    exportColors,
    importColors,
  };
}