import { useColorScheme } from "react-native";

export const lightTheme = {
  background: "#f5f5f7",
  surface: "#ffffff",
  elevated: "rgba(255,255,255,0.85)",
  border: "#e5e5ea",
  borderSubtle: "rgba(0,0,0,0.06)",
  text: "#1d1d1f",
  textSecondary: "#8e8e93",
  textTertiary: "#c7c7cc",
  accent: "#007aff",
  success: "#34c759",
  warning: "#ff9f0a",
  danger: "#ff3b30",
  tabBar: "rgba(255,255,255,0.92)",
};

export const darkTheme = {
  background: "#000000",
  surface: "#1c1c1e",
  elevated: "rgba(44,44,46,0.92)",
  border: "rgba(255,255,255,0.10)",
  borderSubtle: "rgba(255,255,255,0.05)",
  text: "#f5f5f7",
  textSecondary: "#8e8e93",
  textTertiary: "#48484a",
  accent: "#0a84ff",
  success: "#30d158",
  warning: "#ffd60a",
  danger: "#ff453a",
  tabBar: "rgba(28,28,30,0.92)",
};

export type Theme = typeof lightTheme;

export function useTheme(): Theme {
  const scheme = useColorScheme();
  return scheme === "dark" ? darkTheme : lightTheme;
}
