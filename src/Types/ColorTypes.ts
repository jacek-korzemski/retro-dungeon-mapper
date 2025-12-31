export interface ColorScheme {
  bg: string;
  floor: string;
  wall: string;
  empty: string;
  text: string;
  accent: string;
  border: string;
  symbol: string;
  gridLine: string;
}

export const DEFAULT_COLORS: ColorScheme = {
  bg: "#1a1a2e",
  floor: "#2d4a6f",
  wall: "#0a1628",
  empty: "#1a1a2e",
  text: "#7faacc",
  accent: "#e94560",
  border: "#3a5a7c",
  symbol: "#aaccee",
  gridLine: "rgba(127, 170, 204, 0.25)",
};

export const COLOR_LABELS: Record<keyof ColorScheme, string> = {
  bg: "Tło",
  floor: "Podłoga",
  wall: "Ściana",
  empty: "Puste",
  text: "Tekst",
  accent: "Akcent",
  border: "Obramowanie",
  symbol: "Symbole",
  gridLine: "Linie siatki",
};