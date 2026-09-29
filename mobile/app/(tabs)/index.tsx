import { View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useHomeMode, type HomeMode } from "../../src/prefs";
import { useTheme } from "../../src/theme";
import { HomeHeader } from "../../src/home/Header";
import { Minimal } from "../../src/home/Minimal";
import { Jarvis } from "../../src/home/Jarvis";

const fill = { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 } as const;

export default function HomeScreen() {
  const { c } = useTheme();
  const [mode, setMode] = useHomeMode();
  const change = (m: HomeMode) => {
    if (m === mode) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setMode(m);
  };
  return (
    <View style={{ flex: 1, backgroundColor: c.paper }}>
      <Animated.View key={mode} entering={FadeIn.duration(240)} exiting={FadeOut.duration(160)} style={fill}>
        {mode === "jarvis" ? <Jarvis header={<HomeHeader mode={mode} onMode={change} tone="jarvis" />} /> : <Minimal header={<HomeHeader mode={mode} onMode={change} tone="oat" />} />}
      </Animated.View>
    </View>
  );
}
