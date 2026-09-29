import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Pressable, View, type DimensionValue } from "react-native";
import Animated, { Easing, FadeInDown, FadeOut, cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../theme";
import { Text } from "./text";

/* Empty ------------------------------------------------------------------------------------------ */

/** A real empty state: a serif italic title and one calm line. */
export function Empty({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  const { c, fonts } = useTheme();
  return (
    <View style={{ paddingVertical: 44, alignItems: "center" }}>
      <Text size={20} style={{ fontFamily: fonts.serifItalic, textAlign: "center" }}>
        {title}
      </Text>
      {children ? (
        <Text size={13.5} tone="muted" align="center" style={{ marginTop: 6, maxWidth: 300 }}>
          {children}
        </Text>
      ) : null}
      {action ? <View style={{ marginTop: 16 }}>{action}</View> : null}
    </View>
  );
}

/* Skeletons -------------------------------------------------------------------------------------- */

/** A shimmering block in soft/line tones. Static when reduce motion is on. */
export function Skeleton({ width = "100%", height = 14, radius = 6 }: { width?: DimensionValue; height?: number; radius?: number }) {
  const { c } = useTheme();
  const reduce = useReducedMotion();
  const o = useSharedValue(1);
  useEffect(() => {
    if (reduce) return;
    o.value = withRepeat(withSequence(withTiming(0.45, { duration: 800, easing: Easing.inOut(Easing.quad) }), withTiming(1, { duration: 800, easing: Easing.inOut(Easing.quad) })), -1);
    return () => cancelAnimation(o);
  }, [reduce, o]);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View accessibilityElementsHidden importantForAccessibility="no" style={[{ width, height, borderRadius: radius, backgroundColor: c.soft }, style]} />;
}

/** A list row: a left block, two lines of text and a right-hand figure. */
export function SkeletonRow({ avatar = false }: { avatar?: boolean }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, minHeight: 56, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.line }}>
      {avatar ? <Skeleton width={36} height={36} radius={18} /> : null}
      <View style={{ flex: 1, gap: 8 }}>
        <Skeleton width="62%" height={13} />
        <Skeleton width="38%" height={10} />
      </View>
      <Skeleton width={44} height={12} />
    </View>
  );
}

/** A block of `rows` skeleton rows with a hairline on top. */
export function SkeletonList({ rows = 5, avatar = false }: { rows?: number; avatar?: boolean }) {
  const { c } = useTheme();
  return (
    <View style={{ borderTopWidth: 1, borderTopColor: c.line }}>
      {Array.from({ length: rows }, (_, i) => (
        <SkeletonRow key={i} avatar={avatar} />
      ))}
    </View>
  );
}

/** A figure or card placeholder. */
export function SkeletonBlock({ height = 96, width = "100%" }: { height?: number; width?: DimensionValue }) {
  return <Skeleton width={width} height={height} radius={10} />;
}

/**
 * Pretend sync. Returns `loading` true for a random 400-900ms on the first visit to each key in a
 * session, and again whenever `refreshCount` changes. There is no network; this only paces the UI.
 */
const visited = new Set<string>();
export function useSimulatedLoad(key: string, refreshCount = 0) {
  const [loading, setLoading] = useState(() => !visited.has(key));
  const first = useRef(true);
  useEffect(() => {
    const isFirst = first.current;
    first.current = false;
    if (isFirst && visited.has(key)) return;
    visited.add(key);
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 400 + Math.random() * 500);
    return () => clearTimeout(t);
  }, [key, refreshCount]);
  return loading;
}

/* Toasts ----------------------------------------------------------------------------------------- */

type ToastMsg = { id: number; text: string; action?: { label: string; run: () => void } };
let toasts: ToastMsg[] = [];
const toastListeners = new Set<(t: ToastMsg[]) => void>();
const push = () => toastListeners.forEach((l) => l(toasts));
const drop = (id: number) => {
  toasts = toasts.filter((x) => x.id !== id);
  push();
};

/** Show a short confirmation: `toast("Task added", { label: "Undo", run: undo })`. */
export function toast(text: string, action?: ToastMsg["action"]) {
  const t: ToastMsg = { id: Date.now() + Math.random(), text, action };
  toasts = [...toasts, t].slice(-3);
  push();
  setTimeout(() => drop(t.id), 4200);
}

/** Mount once, near the root. */
export function ToastHost() {
  const { c, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const [list, setList] = useState<ToastMsg[]>(toasts);
  useEffect(() => {
    toastListeners.add(setList);
    return () => void toastListeners.delete(setList);
  }, []);
  const bottom = useMemo(() => insets.bottom + 72, [insets.bottom]);
  return (
    <View pointerEvents="box-none" accessibilityLiveRegion="polite" style={{ position: "absolute", left: 16, right: 16, bottom, alignItems: "center", gap: 8 }}>
      {list.map((t) => (
        <Animated.View
          key={t.id}
          entering={FadeInDown.duration(180)}
          exiting={FadeOut.duration(140)}
          style={{ flexDirection: "row", alignItems: "center", gap: 16, backgroundColor: c.ink, borderRadius: 8, paddingHorizontal: 16, minHeight: 44, maxWidth: "100%" }}
        >
          <Text size={13.5} tone="paper" style={{ flexShrink: 1 }}>
            {t.text}
          </Text>
          {t.action ? (
            <Pressable
              accessibilityRole="button"
              hitSlop={10}
              onPress={() => {
                t.action!.run();
                drop(t.id);
              }}
            >
              <Text size={13.5} tone="paper" style={{ fontFamily: fonts.sansSemi, textDecorationLine: "underline" }}>
                {t.action.label}
              </Text>
            </Pressable>
          ) : null}
        </Animated.View>
      ))}
    </View>
  );
}
