import { useEffect, type ReactNode } from "react";
import { View } from "react-native";
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import Svg, { Circle, Path } from "react-native-svg";
import { jarvis as J } from "../theme";

const TAU = Math.PI * 2;

/** A path of radial tick marks around (c, c). Every `every`th tick is longer. */
function ticks(c: number, r: number, n: number, len: number, every = 0) {
  let d = "";
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    const l = every && i % every === 0 ? len * 2 : len;
    const [x1, y1] = [c + Math.cos(a) * r, c + Math.sin(a) * r];
    const [x2, y2] = [c + Math.cos(a) * (r - l), c + Math.sin(a) * (r - l)];
    d += `M${x1.toFixed(2)} ${y1.toFixed(2)}L${x2.toFixed(2)} ${y2.toFixed(2)}`;
  }
  return d;
}

/** Rotates its children forever. `dir` is 1 (clockwise) or -1. Static when `still`. */
function Spin({ size, duration, dir, still, children }: { size: number; duration: number; dir: 1 | -1; still: boolean; children: ReactNode }) {
  const r = useSharedValue(0);
  useEffect(() => {
    if (still) return;
    r.value = withRepeat(withTiming(dir * 360, { duration, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(r);
  }, [still, dir, duration, r]);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${r.value}deg` }] }));
  return <Animated.View style={[{ position: "absolute", width: size, height: size }, style]}>{children}</Animated.View>;
}

/** Soft pulse rippling out from the core. */
function Pulse({ size, still }: { size: number; still: boolean }) {
  const p = useSharedValue(0);
  useEffect(() => {
    if (still) return;
    p.value = withRepeat(withSequence(withTiming(1, { duration: 2600, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: 0 })), -1, false);
    return () => cancelAnimation(p);
  }, [still, p]);
  const style = useAnimatedStyle(() => ({ opacity: 0.45 * (1 - p.value), transform: [{ scale: 0.4 + p.value * 0.6 }] }));
  return <Animated.View pointerEvents="none" style={[{ position: "absolute", width: size, height: size, borderRadius: size / 2, borderWidth: 1, borderColor: J.teal }, style]} />;
}

/**
 * The central orb: four concentric rings turning at different speeds and directions, with tick marks,
 * the Orbit accent dot orbiting on the third ring, and a soft pulse. Reduce motion makes it static.
 */
export function JarvisOrb({ size }: { size: number }) {
  const still = useReducedMotion();
  const c = size / 2;
  const r1 = c - 2;
  const r2 = c * 0.8;
  const r3 = c * 0.62;
  const r4 = c * 0.43;
  const core = c * 0.27;
  const dotA = -0.9;
  const arcs = (r: number, parts: number[]) => {
    const circ = TAU * r;
    return parts.map((p, i) => ({ dash: `${circ * p} ${circ * (1 - p)}`, off: -circ * (i / parts.length) }));
  };
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {/* soft glow, allowed on this screen only */}
      <View style={{ position: "absolute", width: size * 0.6, height: size * 0.6, borderRadius: size, backgroundColor: J.teal, opacity: 0.05, shadowColor: J.teal, shadowOpacity: 0.5, shadowRadius: 40, shadowOffset: { width: 0, height: 0 } }} />
      <Spin size={size} duration={90_000} dir={1} still={still}>
        <Svg width={size} height={size}>
          <Circle cx={c} cy={c} r={r1} stroke={J.lineSoft} strokeWidth={1} fill="none" />
          <Path d={ticks(c, r1, 90, 3, 5)} stroke={J.tealDim} strokeWidth={1} />
        </Svg>
      </Spin>
      <Spin size={size} duration={52_000} dir={-1} still={still}>
        <Svg width={size} height={size}>
          <Circle cx={c} cy={c} r={r2} stroke={J.line} strokeWidth={1} fill="none" strokeDasharray="2 7" />
          <Circle cx={c + Math.cos(0.7) * r2} cy={c + Math.sin(0.7) * r2} r={3.5} fill={J.heather} />
          <Circle cx={c + Math.cos(0.7 + Math.PI) * r2} cy={c + Math.sin(0.7 + Math.PI) * r2} r={2} fill={J.heather} opacity={0.6} />
        </Svg>
      </Spin>
      <Spin size={size} duration={22_000} dir={1} still={still}>
        <Svg width={size} height={size}>
          <Circle cx={c} cy={c} r={r3} stroke={J.line} strokeWidth={1} fill="none" />
          <Path d={ticks(c, r3, 48, 2.5, 4)} stroke={J.tealDim} strokeWidth={1} />
          <Circle cx={c + Math.cos(dotA) * r3} cy={c + Math.sin(dotA) * r3} r={9} fill={J.teal} opacity={0.18} />
          <Circle cx={c + Math.cos(dotA) * r3} cy={c + Math.sin(dotA) * r3} r={5} fill={J.teal} />
        </Svg>
      </Spin>
      <Spin size={size} duration={14_000} dir={-1} still={still}>
        <Svg width={size} height={size}>
          {arcs(r4, [0.22, 0.14, 0.3]).map((a, i) => (
            <Circle key={i} cx={c} cy={c} r={r4} stroke={i === 1 ? J.heather : J.teal} strokeWidth={i === 1 ? 2 : 1.5} fill="none" strokeDasharray={a.dash} strokeDashoffset={a.off} strokeLinecap="round" opacity={0.85} />
          ))}
        </Svg>
      </Spin>
      <Pulse size={core * 2.6} still={still} />
      <View style={{ width: core * 2, height: core * 2, borderRadius: core, borderWidth: 1, borderColor: J.line, backgroundColor: J.ground2, alignItems: "center", justifyContent: "center" }}>
        <Svg width={core * 1.1} height={core * 1.0} viewBox="10 8 90 82">
          <Circle cx={44} cy={56} r={29} stroke={J.text} strokeWidth={7} fill="none" />
          <Circle cx={84} cy={22} r={10} fill={J.teal} />
        </Svg>
      </View>
    </View>
  );
}
