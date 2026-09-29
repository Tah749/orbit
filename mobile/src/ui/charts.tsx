import { View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { useTheme } from "../theme";
import type { Tone } from "./text";

/** A thin line chart. Values oldest first. */
export function Sparkline({ values, width = 120, height = 32, color, area = false, strokeWidth = 1.5 }: { values: number[]; width?: number; height?: number; color?: string; area?: boolean; strokeWidth?: number }) {
  const { c } = useTheme();
  if (values.length < 2) return null;
  const col = color ?? c.accent;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * width, height - 2 - ((v - min) / span) * (height - 4)] as const);
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} accessibilityElementsHidden importantForAccessibility="no">
      {area ? <Path d={`${d} L${width} ${height} L0 ${height} Z`} fill={col} opacity={0.08} /> : null}
      <Path d={d} fill="none" stroke={col} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" />
    </Svg>
  );
}

/** Simple vertical bars with an optional highlighted bar. */
export function Bars({ values, highlight, height = 64, color }: { values: number[]; highlight?: number; height?: number; color?: string }) {
  const { c } = useTheme();
  const max = Math.max(...values, 1);
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 3, height }} accessibilityElementsHidden importantForAccessibility="no">
      {values.map((v, i) => (
        <View key={i} style={{ flex: 1, minWidth: 0, height: `${Math.max(2, (v / max) * 100)}%`, borderRadius: 2, backgroundColor: i === highlight ? (color ?? c.accent) : c.lineStrong }} />
      ))}
    </View>
  );
}

/** A horizontal meter, e.g. budget used. Turns coral at 100%. */
export function Meter({ value, max, tone = "accent" }: { value: number; max: number; tone?: Tone }) {
  const { c } = useTheme();
  const pct = Math.min(100, Math.max(0, (value / (max || 1)) * 100));
  const col = pct >= 100 ? c.coral : { neutral: c.faint, accent: c.accent, info: c.info, warn: c.warn, coral: c.coral }[tone];
  return (
    <View style={{ height: 6, width: "100%", borderRadius: 3, overflow: "hidden", backgroundColor: c.soft }} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(pct) }}>
      <View style={{ height: "100%", width: `${pct}%`, borderRadius: 3, backgroundColor: col }} />
    </View>
  );
}

/** A radial gauge: a thin ring filled to value/max. Used by the Jarvis home screen and figures. */
export function Ring({ value, max, size = 72, stroke = 5, color, track, children }: { value: number; max: number; size?: number; stroke?: number; color?: string; track?: string; children?: React.ReactNode }) {
  const { c } = useTheme();
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(1, Math.max(0, value / (max || 1)));
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track ?? c.soft} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color ?? c.accent}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circ} ${circ}`}
          strokeDashoffset={circ * (1 - pct)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {children}
    </View>
  );
}
