import { Pressable, Text as RNText, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useRouter } from "expo-router";
import { ChatCircleText } from "phosphor-react-native";
import { fonts, jarvis, useTheme } from "../theme";
import { IconButton, Segmented } from "../ui";
import type { HomeMode } from "../prefs";

const LABELS = { Minimal: "minimal", Jarvis: "jarvis" } as const;
type Label = keyof typeof LABELS;

/** The Tracked mark (ring and dot) with the letter-spaced wordmark. */
export function Brand({ ring, dot, word }: { ring: string; dot: string; word: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }} accessible accessibilityLabel="Orbit" accessibilityRole="image">
      <Svg width={26} height={24} viewBox="10 8 90 82">
        <Circle cx={44} cy={56} r={29} stroke={ring} strokeWidth={7} fill="none" />
        <Circle cx={84} cy={22} r={10} fill={dot} />
      </Svg>
      <RNText style={{ fontFamily: fonts.sans, fontSize: 15, letterSpacing: 4, color: word }}>orbit</RNText>
    </View>
  );
}

/** Home header: mark, Minimal | Jarvis switch and an Ask shortcut. `tone` picks the oat or Jarvis styling. */
export function HomeHeader({ mode, onMode, tone }: { mode: HomeMode; onMode: (m: HomeMode) => void; tone: "oat" | "jarvis" }) {
  const { c } = useTheme();
  const router = useRouter();
  const j = tone === "jarvis";
  const value: Label = mode === "jarvis" ? "Jarvis" : "Minimal";
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20, minHeight: 44 }}>
      <Brand ring={j ? jarvis.text : c.ink} dot={j ? jarvis.teal : c.accent} word={j ? jarvis.text : c.ink} />
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
        {j ? (
          <View accessibilityRole="radiogroup" accessibilityLabel="Home view" style={{ flexDirection: "row", borderWidth: 1, borderColor: jarvis.line, borderRadius: 6, padding: 2 }}>
            {(Object.keys(LABELS) as Label[]).map((l) => {
              const on = l === value;
              return (
                <Pressable
                  key={l}
                  onPress={() => onMode(LABELS[l])}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  style={{ minHeight: 36, paddingHorizontal: 11, borderRadius: 4, justifyContent: "center", backgroundColor: on ? "rgba(92,201,188,0.16)" : "transparent" }}
                >
                  <RNText style={{ fontFamily: fonts.monoMedium, fontSize: 10.5, letterSpacing: 1.2, textTransform: "uppercase", color: on ? jarvis.teal : jarvis.muted }}>{l}</RNText>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <Segmented<Label> items={["Minimal", "Jarvis"]} value={value} onChange={(l) => onMode(LABELS[l])} label="Home view" />
        )}
        <IconButton label="Ask Orbit" onPress={() => router.push("/(tabs)/ask")}>
          <ChatCircleText size={22} color={j ? jarvis.teal : c.ink} />
        </IconButton>
      </View>
    </View>
  );
}
