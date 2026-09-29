import { useEffect } from "react";
import { View, type DimensionValue } from "react-native";
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { jarvis as J } from "../theme";

function Block({ width = "100%", height = 12, radius = 4 }: { width?: DimensionValue; height?: number; radius?: number }) {
  const reduce = useReducedMotion();
  const o = useSharedValue(1);
  useEffect(() => {
    if (reduce) return;
    o.value = withRepeat(withSequence(withTiming(0.4, { duration: 800, easing: Easing.inOut(Easing.quad) }), withTiming(1, { duration: 800, easing: Easing.inOut(Easing.quad) })), -1);
    return () => cancelAnimation(o);
  }, [reduce, o]);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View accessibilityElementsHidden importantForAccessibility="no" style={[{ width, height, borderRadius: radius, backgroundColor: "rgba(92,201,188,0.10)", borderWidth: 1, borderColor: J.lineSoft }, style]} />;
}

/** Placeholder that mirrors the Jarvis layout: orb rings, clock, four gauges, feed lines and tiles. */
export function JarvisSkeleton({ orb }: { orb: number }) {
  return (
    <View>
      <View style={{ alignItems: "center" }}>
        <View style={{ width: orb, height: orb, alignItems: "center", justifyContent: "center" }}>
          {[1, 0.78, 0.58, 0.4].map((f) => (
            <View key={f} style={{ position: "absolute" }}>
              <Block width={orb * f} height={orb * f} radius={orb} />
            </View>
          ))}
        </View>
        <View style={{ alignItems: "center", gap: 8, marginTop: 14 }}>
          <Block width={170} height={30} />
          <Block width={130} height={10} />
          <Block width={190} height={10} />
        </View>
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 28 }}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={{ flex: 1, alignItems: "center", gap: 8 }}>
            <Block width={74} height={74} radius={37} />
            <Block width={44} height={8} />
          </View>
        ))}
      </View>
      <View style={{ gap: 8, marginTop: 28 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <Block key={i} height={12} width={i % 2 ? "85%" : "100%"} />
        ))}
      </View>
      <View style={{ gap: 10, marginTop: 28 }}>
        <Block height={110} radius={4} />
        <Block height={92} radius={4} />
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Block height={100} radius={4} />
          </View>
          <View style={{ flex: 1 }}>
            <Block height={100} radius={4} />
          </View>
        </View>
      </View>
    </View>
  );
}
