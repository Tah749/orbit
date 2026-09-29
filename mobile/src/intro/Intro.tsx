import { useEffect, useRef } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { Easing, interpolate, useAnimatedProps, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withSpring, withTiming } from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
import * as Haptics from "expo-haptics";
import { fonts } from "../theme";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Geometry of the Tracked mark (src/components/ui/OrbitAppIcon.tsx): ring centre (44,56) r29, dot at (84,22) r10.
const CX = 44;
const CY = 56;
const R = 29;
const CIRC = 2 * Math.PI * R;
const ORBIT_R = Math.hypot(84 - CX, 22 - CY);
const REST = Math.atan2(22 - CY, 84 - CX);

const INK = "#151412";
const CREAM = "#F5F3EF";
const TEAL = "#5CC9BC";

/**
 * The launch animation, about 1.8s: the ring draws itself, the teal dot swings into its orbit and
 * lands (light haptic), a soft pulse ripples out, "orbit" letter-spaces in, then everything lifts away.
 * Tap to skip. With reduce motion on it is a quick fade.
 */
export function Intro({ onDone }: { onDone: () => void }) {
  const reduce = useReducedMotion();
  const ring = useSharedValue(reduce ? 1 : 0);
  const dot = useSharedValue(reduce ? 1 : 0);
  const pulse = useSharedValue(0);
  const word = useSharedValue(reduce ? 1 : 0);
  const exit = useSharedValue(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const finished = useRef(false);

  const finish = (fast: boolean) => {
    if (finished.current) return;
    finished.current = true;
    timers.current.forEach(clearTimeout);
    exit.value = withTiming(1, { duration: fast ? 200 : 320, easing: Easing.in(Easing.quad) });
    setTimeout(onDone, fast ? 220 : 340);
  };

  useEffect(() => {
    if (reduce) {
      timers.current.push(setTimeout(() => finish(false), 450));
      return () => timers.current.forEach(clearTimeout);
    }
    ring.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });
    dot.value = withDelay(450, withSpring(1, { damping: 11, stiffness: 90, mass: 0.9 }));
    pulse.value = withDelay(950, withTiming(1, { duration: 650, easing: Easing.out(Easing.quad) }));
    word.value = withDelay(850, withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) }));
    timers.current.push(setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}), 950));
    timers.current.push(setTimeout(() => finish(false), 1480));
    return () => timers.current.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ringProps = useAnimatedProps(() => ({ strokeDashoffset: CIRC * (1 - ring.value) }));
  const dotProps = useAnimatedProps(() => {
    const a = REST - (1 - dot.value) * Math.PI * 1.15;
    return { cx: CX + Math.cos(a) * ORBIT_R, cy: CY + Math.sin(a) * ORBIT_R, opacity: Math.min(1, dot.value * 4) };
  });
  const pulseProps = useAnimatedProps(() => ({ r: 10 + pulse.value * 34, opacity: (1 - pulse.value) * 0.45 }));
  const wordStyle = useAnimatedStyle(() => ({
    opacity: word.value,
    letterSpacing: interpolate(word.value, [0, 1], [2, 11]),
    transform: [{ translateY: interpolate(word.value, [0, 1], [6, 0]) }],
  }));
  const wrapStyle = useAnimatedStyle(() => ({
    opacity: 1 - exit.value,
    transform: [{ translateY: -14 * exit.value }, { scale: 1 - 0.04 * exit.value }],
  }));
  const bgStyle = useAnimatedStyle(() => ({ opacity: 1 - exit.value }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: INK }, bgStyle]} pointerEvents="auto">
      <Pressable accessibilityRole="button" accessibilityLabel="Skip intro" style={StyleSheet.absoluteFill} onPress={() => finish(true)}>
        <Animated.View style={[{ flex: 1, alignItems: "center", justifyContent: "center", gap: 22 }, wrapStyle]}>
          <View>
            <Svg width={132} height={132} viewBox="4 4 100 100">
              <AnimatedCircle cx={84} cy={22} fill="none" stroke={TEAL} strokeWidth={1.5} animatedProps={pulseProps} />
              <AnimatedCircle
                cx={CX}
                cy={CY}
                r={R}
                fill="none"
                stroke={CREAM}
                strokeWidth={11}
                strokeDasharray={`${CIRC} ${CIRC}`}
                strokeLinecap="butt"
                transform={`rotate(-90 ${CX} ${CY})`}
                animatedProps={ringProps}
              />
              <AnimatedCircle r={10} fill={TEAL} animatedProps={dotProps} />
            </Svg>
          </View>
          <Animated.Text style={[{ fontFamily: fonts.sans, fontSize: 26, color: CREAM, marginLeft: 11 }, wordStyle]}>orbit</Animated.Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}
