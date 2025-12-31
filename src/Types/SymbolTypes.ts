import { SymbolType } from "./MapTypes";

export const SYMBOLS: Record<SymbolType, { char: string; name: string }> = {
  none: { char: "", name: "Brak" },
  door: { char: "▯", name: "Drzwi" },
  "door-secret": { char: "S", name: "Sekretne" },
  "stairs-up": { char: "△", name: "Schody ↑" },
  "stairs-down": { char: "▽", name: "Schody ↓" },
  skull: { char: "☠", name: "Czaszka" },
  star: { char: "★", name: "Gwiazdka" },
  trap: { char: "⚠", name: "Pułapka" },
  chest: { char: "▣", name: "Skrzynia" },
  pillar: { char: "◉", name: "Filar" },
  water: { char: "≈", name: "Woda" },
  entrance: { char: "⊕", name: "Wejście" },
  exit: { char: "⊗", name: "Wyjście" },
  monster: { char: "M", name: "Potwór" },
  npc: { char: "@", name: "NPC" },
};