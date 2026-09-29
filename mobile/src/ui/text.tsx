import type { ReactNode } from "react";
import { Text as RNText, View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import { sourceName, type SourceId } from "@orbit/data/sources";
import { money, type Tone } from "@orbit/format";
import { useTheme, type Colors, fonts as fontMap } from "../theme";

export type { Tone };

type Ink = "ink" | "muted" | "faint" | "accent" | "coral" | "warn" | "info" | "paper";
export type TextProps = {
  children?: ReactNode;
  size?: number;
  font?: keyof typeof fontMap;
  tone?: Ink;
  /** Tabular figures for numbers. */
  num?: boolean;
  lines?: number;
  style?: StyleProp<TextStyle>;
  align?: "left" | "center" | "right";
  accessibilityRole?: "header" | "text";
};

/** Body text in Geist. Sizes follow the web app: 13-15px UI text. */
export function Text({ children, size = 14.5, font = "sans", tone = "ink", num, lines, style, align, accessibilityRole }: TextProps) {
  const { c } = useTheme();
  return (
    <RNText
      accessibilityRole={accessibilityRole}
      numberOfLines={lines}
      style={[
        { fontFamily: fontMap[font], fontSize: size, color: c[tone], lineHeight: Math.round(size * 1.42), textAlign: align },
        num && { fontVariant: ["tabular-nums"] },
        style,
      ]}
    >
      {children}
    </RNText>
  );
}

/** Small uppercase mono label: eyebrows, metadata keys. */
export function Label({ children, tone = "muted", style }: { children: ReactNode; tone?: Ink; style?: StyleProp<TextStyle> }) {
  const { c } = useTheme();
  return (
    <RNText style={[{ fontFamily: fontMap.monoMedium, fontSize: 10.5, letterSpacing: 1.5, textTransform: "uppercase", color: c[tone] }, style]}>
      {children}
    </RNText>
  );
}

export const toneColors = (c: Colors): Record<Tone, { bg: string; fg: string }> => ({
  neutral: { bg: c.soft, fg: c.muted },
  accent: { bg: c.accentBg, fg: c.accentFg },
  info: { bg: c.tintInfo, fg: c.info },
  warn: { bg: c.tintWarn, fg: c.warn },
  coral: { bg: c.tintCoral, fg: c.coral },
});

/** A small status tag. Square-ish (4px radius), not a pill. */
export function Tag({ tone = "neutral", children, style }: { tone?: Tone; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { c } = useTheme();
  const t = toneColors(c)[tone];
  return (
    <View style={[{ alignSelf: "flex-start", backgroundColor: t.bg, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 3 }, style]}>
      <RNText style={{ fontFamily: fontMap.sansMedium, fontSize: 11.5, lineHeight: 14, color: t.fg }}>{children}</RNText>
    </View>
  );
}

/** A coloured dot, e.g. a calendar colour. */
export function Dot({ tone = "accent", size = 8 }: { tone?: Tone | "ink"; size?: number }) {
  const { c } = useTheme();
  const col = { neutral: c.faint, accent: c.accent, info: c.info, warn: c.warn, coral: c.coral, ink: c.ink }[tone];
  return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: col }} />;
}

/** "via Gmail": where something came from. Every surfaced item should carry one. */
export function Source({ id, color }: { id: SourceId; color?: string }) {
  const { c } = useTheme();
  const col = color ?? c.faint;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: col }} />
      <RNText style={{ fontFamily: fontMap.mono, fontSize: 10.5, letterSpacing: 0.9, textTransform: "uppercase", color: col }}>{sourceName[id]}</RNText>
    </View>
  );
}

/** An amount in tabular figures. Income can be shown in the accent with `signed`. */
export function Amount({ value, signed = false, whole = false, size = 14.5, tone, style }: { value: number; signed?: boolean; whole?: boolean; size?: number; tone?: Ink; style?: StyleProp<TextStyle> }) {
  const text = signed && value > 0 ? `+${money(value, whole)}` : money(value, whole);
  return (
    <Text size={size} num font="sansMedium" tone={tone ?? (signed && value > 0 ? "accent" : "ink")} style={style}>
      {text.replace("-", "−")}
    </Text>
  );
}

/** A headline figure with a label and optional note underneath. */
export function Figure({ label, value, note, size = 26, tone = "ink" }: { label: ReactNode; value: ReactNode; note?: ReactNode; size?: number; tone?: Ink }) {
  return (
    <View style={{ minWidth: 0 }}>
      <Label>{label}</Label>
      <Text size={size} font="sansMedium" num tone={tone} style={{ marginTop: 6, lineHeight: Math.round(size * 1.1), letterSpacing: -0.5 }}>
        {value}
      </Text>
      {note ? (
        <Text size={12.5} tone="muted" style={{ marginTop: 5 }}>
          {note}
        </Text>
      ) : null}
    </View>
  );
}

/** Initials in a soft tint. Colour is picked from the name. */
export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const { c } = useTheme();
  const initials = name
    .replace(/\(.*\)/, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const tones = [
    { bg: c.accentBg, fg: c.accentFg },
    { bg: c.tintInfo, fg: c.info },
    { bg: c.tintWarn, fg: c.warn },
    { bg: c.tintCoral, fg: c.coral },
    { bg: c.soft, fg: c.ink },
  ];
  const t = tones[[...name].reduce((a, ch) => a + ch.charCodeAt(0), 0) % tones.length];
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: t.bg, alignItems: "center", justifyContent: "center" }} accessibilityElementsHidden importantForAccessibility="no">
      <RNText style={{ fontFamily: fontMap.sansMedium, fontSize: size * 0.38, color: t.fg }}>{initials}</RNText>
    </View>
  );
}
