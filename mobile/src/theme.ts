import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

/** The Oat scheme, copied from src/index.css. Names match the web design tokens. */
export type Colors = {
  paper: string;
  surface: string;
  soft: string;
  line: string;
  lineStrong: string;
  ink: string;
  muted: string;
  faint: string;
  deep: string;
  accent: string;
  accentBg: string;
  accentFg: string;
  info: string;
  coral: string;
  warn: string;
  tintInfo: string;
  tintWarn: string;
  tintCoral: string;
};

export const light: Colors = {
  paper: "#F5F3EF",
  surface: "#FFFFFF",
  soft: "#ECE8E1",
  line: "#DDD7CD",
  lineStrong: "#C7BFB2",
  ink: "#1D1B18",
  muted: "#67625A",
  faint: "#8A847A",
  deep: "#EFEBE4",
  accent: "#0C6B66",
  accentBg: "#E1EFEC",
  accentFg: "#084B47",
  info: "#6B4F8F",
  coral: "#B8382A",
  warn: "#8C5C00",
  tintInfo: "#ECE6F3",
  tintWarn: "#F6ECD9",
  tintCoral: "#F7E3DF",
};

export const dark: Colors = {
  paper: "#151412",
  surface: "#1D1B19",
  soft: "#272522",
  line: "#35322D",
  lineStrong: "#4A463F",
  ink: "#F2EFEA",
  muted: "#A9A399",
  faint: "#767067",
  deep: "#100F0E",
  accent: "#5CC9BC",
  accentBg: "#12302D",
  accentFg: "#A8E3DA",
  info: "#BBA3DD",
  coral: "#F07A68",
  warn: "#E4B458",
  tintInfo: "#231D2C",
  tintWarn: "#2A2114",
  tintCoral: "#2C1A17",
};

/** The Jarvis home screen: a deep petrol ground with teal linework. Always dark. */
export const jarvis = {
  ground: "#071413",
  ground2: "#0A1B1A",
  panel: "rgba(92, 201, 188, 0.06)",
  line: "rgba(92, 201, 188, 0.22)",
  lineSoft: "rgba(92, 201, 188, 0.12)",
  teal: "#5CC9BC",
  tealDim: "rgba(92, 201, 188, 0.55)",
  heather: "#BBA3DD",
  text: "#F2EFEA",
  muted: "#7FA39E",
  warn: "#E4B458",
  coral: "#F07A68",
} as const;

/** Font family names as registered by expo-font (see app/_layout.tsx). */
export const fonts = {
  serif: "Newsreader_400Regular",
  serifItalic: "Newsreader_400Regular_Italic",
  serifMedium: "Newsreader_500Medium",
  sans: "Geist_400Regular",
  sansMedium: "Geist_500Medium",
  sansSemi: "Geist_600SemiBold",
  mono: "GeistMono_400Regular",
  monoMedium: "GeistMono_500Medium",
} as const;

export type Pref = "system" | "light" | "dark";
const KEY = "orbit.theme";

type Ctx = { c: Colors; mode: "light" | "dark"; pref: Pref; setPref: (p: Pref) => void; fonts: typeof fonts };
const ThemeCtx = createContext<Ctx>({ c: light, mode: "light", pref: "system", setPref: () => {}, fonts });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [pref, setPrefState] = useState<Pref>("system");

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => {
        if (v === "light" || v === "dark" || v === "system") setPrefState(v);
      })
      .catch(() => {});
  }, []);

  const setPref = useCallback((p: Pref) => {
    setPrefState(p);
    AsyncStorage.setItem(KEY, p).catch(() => {});
  }, []);

  const mode: "light" | "dark" = pref === "system" ? (system === "dark" ? "dark" : "light") : pref;
  const value = useMemo<Ctx>(() => ({ c: mode === "dark" ? dark : light, mode, pref, setPref, fonts }), [mode, pref, setPref]);
  return createElement(ThemeCtx.Provider, { value }, children);
}

export const useTheme = () => useContext(ThemeCtx);
