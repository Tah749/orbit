import { useCallback, useState, type ReactNode } from "react";
import { Pressable, RefreshControl, ScrollView, View, type StyleProp, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { CaretLeft, CaretRight } from "phosphor-react-native";
import { useTheme } from "../theme";
import { Label, Text } from "./text";
import { IconButton } from "./controls";

export const GUTTER = 16;

/**
 * A screen: safe area, paper background, 16px gutters and a scroll view.
 * `onRefresh` turns on pull-to-refresh (the spinner shows briefly; the callback bumps a refresh count).
 * `back` shows a back button, for stack screens.
 */
export function Screen({
  children,
  onRefresh,
  scroll = true,
  back = false,
  bottomInset = true,
  background,
  style,
}: {
  children: ReactNode;
  onRefresh?: () => void;
  scroll?: boolean;
  back?: boolean;
  /** Leave room for the tab bar / home indicator. */
  bottomInset?: boolean;
  background?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const refresh = useCallback(() => {
    setRefreshing(true);
    onRefresh?.();
    setTimeout(() => setRefreshing(false), 700);
  }, [onRefresh]);

  const top = (
    <>
      {back && (
        <View style={{ flexDirection: "row", marginLeft: -8, marginBottom: 4 }}>
          <IconButton label="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}>
            <CaretLeft size={20} color={c.ink} />
          </IconButton>
        </View>
      )}
    </>
  );
  const pad = { paddingTop: insets.top + 8, paddingHorizontal: GUTTER, paddingBottom: bottomInset ? insets.bottom + 32 : 16 };
  return (
    <View style={[{ flex: 1, backgroundColor: background ?? c.paper }, style]}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={pad}
          keyboardShouldPersistTaps="handled"
          contentInsetAdjustmentBehavior="never"
          refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={c.muted} colors={[c.accent]} /> : undefined}
        >
          {top}
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, pad]}>
          {top}
          {children}
        </View>
      )}
    </View>
  );
}

/** Small mono eyebrow, serif title, optional lede and right-hand actions, then content. */
export function Page({ eyebrow, title, lede, actions, children }: { eyebrow?: ReactNode; title: ReactNode; lede?: ReactNode; actions?: ReactNode; children?: ReactNode }) {
  const { c, fonts } = useTheme();
  return (
    <View>
      <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 12, paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: c.line }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          {eyebrow ? <Label style={{ marginBottom: 8 }}>{eyebrow}</Label> : null}
          <Text size={34} font="serif" style={{ fontFamily: fonts.serif, lineHeight: 37, letterSpacing: -0.7 }} accessibilityRole="header">
            {title}
          </Text>
          {lede ? (
            <Text size={14.5} tone="muted" style={{ marginTop: 8 }}>
              {lede}
            </Text>
          ) : null}
        </View>
        {actions ? <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>{actions}</View> : null}
      </View>
      <View style={{ paddingTop: 22 }}>{children}</View>
    </View>
  );
}

/** A titled block of content, separated by space and a hairline, not a floating card. */
export function Section({ title, meta, action, children, style }: { title?: ReactNode; meta?: ReactNode; action?: ReactNode; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ marginBottom: 26 }, style]}>
      {title || action ? (
        <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 10, flexShrink: 1 }}>
            {title ? (
              <Text size={13.5} font="sansSemi" accessibilityRole="header">
                {title}
              </Text>
            ) : null}
            {meta ? (
              <Text size={12.5} tone="muted" lines={1} style={{ flexShrink: 1 }}>
                {meta}
              </Text>
            ) : null}
          </View>
          {action}
        </View>
      ) : null}
      {children}
    </View>
  );
}

/** A list with hairline separators. Put <Row>s inside. */
export function List({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { c } = useTheme();
  return <View style={[{ borderTopWidth: 1, borderTopColor: c.line }, style]}>{children}</View>;
}

/** A pressable list row, at least 48px tall, with a hairline underneath. */
export function Row({
  children,
  onPress,
  onLongPress,
  left,
  right,
  chevron = false,
  minHeight = 48,
  active,
  label,
  style,
}: {
  children?: ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  left?: ReactNode;
  right?: ReactNode;
  chevron?: boolean;
  minHeight?: number;
  active?: boolean;
  /** Accessibility label; defaults to the row's text. */
  label?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { c } = useTheme();
  const body = (
    <>
      {left ? <View style={{ alignItems: "center", justifyContent: "center" }}>{left}</View> : null}
      <View style={{ flex: 1, minWidth: 0 }}>{children}</View>
      {right ? <View style={{ alignItems: "flex-end", justifyContent: "center" }}>{right}</View> : null}
      {chevron ? <CaretRight size={14} color={c.faint} /> : null}
    </>
  );
  const base: ViewStyle = { flexDirection: "row", alignItems: "center", gap: 12, minHeight, paddingVertical: 10, paddingHorizontal: 2, borderBottomWidth: 1, borderBottomColor: c.line };
  if (!onPress && !onLongPress) return <View style={[base, active && { backgroundColor: c.soft }, style]}>{body}</View>;
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [base, (pressed || active) && { backgroundColor: c.soft }, style]}
    >
      {body}
    </Pressable>
  );
}
