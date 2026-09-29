import { type ReactNode } from "react";
import { Pressable, Text as RNText, View, type StyleProp, type TextStyle } from "react-native";
import { useRouter } from "expo-router";
import { ArrowUpRight } from "phosphor-react-native";
import { sourceName, type SourceId } from "@orbit/data/sources";
import { parse, time } from "@orbit/time";
import type { CalEvent } from "@orbit/data/calendar";
import type { Connection } from "@orbit/data/connections";
import { fonts, jarvis as J } from "../theme";
import { Ring, Source } from "../ui";
import { routeFor } from "./routes";
import { ago } from "./stats";

const tab = ["tabular-nums"] as TextStyle["fontVariant"];

/** Mono uppercase label. */
export function JLabel({ children, color = J.muted, style }: { children: ReactNode; color?: string; style?: StyleProp<TextStyle> }) {
  return <RNText style={[{ fontFamily: fonts.monoMedium, fontSize: 10, letterSpacing: 1.4, textTransform: "uppercase", color }, style]}>{children}</RNText>;
}

/** Mono figure with tabular numbers. */
export function JNum({ children, size = 20, color = J.text, style }: { children: ReactNode; size?: number; color?: string; style?: StyleProp<TextStyle> }) {
  return <RNText style={[{ fontFamily: fonts.monoMedium, fontSize: size, color, fontVariant: tab, letterSpacing: -0.3 }, style]}>{children}</RNText>;
}

export function JText({ children, size = 12.5, color = J.muted, lines, style }: { children: ReactNode; size?: number; color?: string; lines?: number; style?: StyleProp<TextStyle> }) {
  return (
    <RNText numberOfLines={lines} style={[{ fontFamily: fonts.sans, fontSize: size, lineHeight: Math.round(size * 1.4), color }, style]}>
      {children}
    </RNText>
  );
}

/** Serif figure: used for only one or two headline numbers. */
export function JSerif({ children, size = 34 }: { children: ReactNode; size?: number }) {
  return <RNText style={{ fontFamily: fonts.serif, fontSize: size, lineHeight: Math.round(size * 1.08), color: J.text, fontVariant: tab, letterSpacing: -0.5 }}>{children}</RNText>;
}

/** A hairline-bordered HUD tile that opens a section. */
export function Panel({ to, label, title, children, width, source }: { to: string; label: string; title: string; children: ReactNode; width?: number | "100%"; source?: SourceId | SourceId[] }) {
  const router = useRouter();
  const sources = source ? (Array.isArray(source) ? source : [source]) : [];
  return (
    <Pressable
      onPress={() => router.push(routeFor(to) as never)}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${label}. Opens ${title}`}
      style={({ pressed }) => ({ width: width ?? "100%", borderWidth: 1, borderColor: J.line, borderRadius: 4, backgroundColor: pressed ? "rgba(92,201,188,0.12)" : J.panel, padding: 12, minHeight: 44 })}
    >
      <View style={{ position: "absolute", top: -1, left: -1, width: 14, height: 14, borderTopWidth: 2, borderLeftWidth: 2, borderColor: J.teal, borderTopLeftRadius: 4 }} />
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <JLabel color={J.tealDim}>{title}</JLabel>
        <ArrowUpRight size={13} color={J.tealDim} />
      </View>
      {children}
      {sources.length ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 10 }}>
          {sources.map((s) => (
            <Source key={s} id={s} color={J.muted} />
          ))}
        </View>
      ) : null}
    </Pressable>
  );
}

/** A section heading with a hairline: "// SYSTEMS". */
export function JHeading({ children, meta }: { children: string; meta?: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 24, marginBottom: 12 }}>
      <JLabel color={J.teal}>{children}</JLabel>
      <View style={{ flex: 1, height: 1, backgroundColor: J.lineSoft }} />
      {meta ? <JLabel>{meta}</JLabel> : null}
    </View>
  );
}

/* Gauges ------------------------------------------------------------------------------------------ */

export function Gauge({ to, title, value, max, centre, caption, a11y, color = J.teal }: { to: string; title: string; value: number; max: number; centre: string; caption: string; a11y: string; color?: string }) {
  const router = useRouter();
  return (
    <Pressable onPress={() => router.push(routeFor(to) as never)} accessibilityRole="button" accessibilityLabel={a11y} style={{ flex: 1, alignItems: "center", minHeight: 44 }}>
      <Ring value={value} max={max} size={74} stroke={4} color={color} track={J.lineSoft}>
        <JNum size={15}>{centre}</JNum>
      </Ring>
      <JLabel color={J.text} style={{ marginTop: 8, fontSize: 9.5 }}>
        {title}
      </JLabel>
      <RNText style={{ fontFamily: fonts.mono, fontSize: 10, color: J.muted, fontVariant: tab, marginTop: 2, textAlign: "center" }}>{caption}</RNText>
    </Pressable>
  );
}

/* Systems feed ------------------------------------------------------------------------------------ */

const statusLabel = (s: Connection["status"]) => (s === "connected" ? { t: "CONNECTED", c: J.teal } : s === "available" ? { t: "OFF", c: J.muted } : s === "coming-soon" ? { t: "SOON", c: J.heather } : { t: "ERROR", c: J.coral });

export function SystemsFeed({ items, now }: { items: Connection[]; now: Date }) {
  const router = useRouter();
  const on = items.filter((c) => c.status === "connected").length;
  return (
    <Pressable
      onPress={() => router.push("/settings")}
      accessibilityRole="button"
      accessibilityLabel={`Systems. ${on} of ${items.length} connections on. Opens settings`}
      style={{ borderWidth: 1, borderColor: J.line, borderRadius: 4, backgroundColor: "rgba(0,0,0,0.25)", paddingVertical: 10, paddingHorizontal: 12 }}
    >
      <RNText style={{ fontFamily: fonts.mono, fontSize: 11, color: J.tealDim, marginBottom: 8 }}>{`> systems --status  (${on}/${items.length})`}</RNText>
      {items.map((c) => {
        const st = statusLabel(c.status);
        const sync = c.status === "connected" && c.lastSync ? `${ago(c.lastSync, now)}${ago(c.lastSync, now) === "now" ? "" : " ago"}` : "--";
        return (
          <View key={c.id} style={{ flexDirection: "row", alignItems: "center", minHeight: 22 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: st.c, opacity: c.status === "connected" ? 1 : 0.5, marginRight: 8 }} />
            <RNText numberOfLines={1} style={{ flex: 1, fontFamily: fonts.mono, fontSize: 11, color: J.text, textTransform: "uppercase", letterSpacing: 0.4 }}>
              {sourceName[c.id]}
            </RNText>
            <RNText style={{ width: 84, fontFamily: fonts.mono, fontSize: 10, color: st.c, letterSpacing: 0.8 }}>{st.t}</RNText>
            <RNText style={{ width: 62, textAlign: "right", fontFamily: fonts.mono, fontSize: 10, color: J.muted, fontVariant: tab }}>{sync}</RNText>
          </View>
        );
      })}
    </Pressable>
  );
}

/* Schedule track ---------------------------------------------------------------------------------- */

const FROM = 6;
const TO = 24;
const frac = (d: Date) => Math.min(1, Math.max(0, (d.getHours() + d.getMinutes() / 60 - FROM) / (TO - FROM)));

/** A horizontal time track, 06:00 to 24:00, with each event as a block and a "now" marker. */
export function TimeTrack({ events, now }: { events: CalEvent[]; now: Date }) {
  const pct = (n: number) => `${(n * 100).toFixed(2)}%` as `${number}%`;
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={{ height: 34, borderTopWidth: 1, borderBottomWidth: 1, borderColor: J.lineSoft }}>
        {[6, 12, 18].map((h) => (
          <View key={h} style={{ position: "absolute", left: pct((h - FROM) / (TO - FROM)), top: 0, bottom: 0, width: 1, backgroundColor: J.lineSoft }} />
        ))}
        {events.map((e) => {
          const a = frac(parse(e.start));
          const b = Math.max(frac(parse(e.end)), a + 0.02);
          const past = parse(e.end) <= now;
          return <View key={e.id} style={{ position: "absolute", left: pct(a), width: pct(b - a), top: 6, bottom: 6, borderRadius: 2, backgroundColor: past ? J.lineSoft : J.tealDim, borderWidth: 1, borderColor: past ? J.lineSoft : J.teal }} />;
        })}
        <View style={{ position: "absolute", left: pct(frac(now)), top: -5, bottom: -5, width: 2, backgroundColor: J.heather }} />
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
        {["06", "12", "18", "24"].map((h) => (
          <RNText key={h} style={{ fontFamily: fonts.mono, fontSize: 9.5, color: J.muted, fontVariant: tab }}>
            {h}
          </RNText>
        ))}
      </View>
    </View>
  );
}

export const hhmm = (d: Date) => time(d.toISOString());
