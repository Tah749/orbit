import { useState, type ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Switch as RNSwitch,
  Text as RNText,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Check as CheckMark, X } from "phosphor-react-native";
import { useTheme } from "../theme";
import { Text } from "./text";

type Variant = "primary" | "accent" | "outline" | "ghost" | "danger";

/** Primary is ink on paper. Use the accent sparingly: one highlight per view. */
export function Button({
  children,
  onPress,
  variant = "outline",
  size = "md",
  disabled,
  icon,
  full,
  style,
}: {
  children: ReactNode;
  onPress?: () => void;
  variant?: Variant;
  size?: "sm" | "md";
  disabled?: boolean;
  icon?: ReactNode;
  full?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { c, fonts } = useTheme();
  const v = {
    primary: { bg: c.ink, fg: c.paper, border: c.ink },
    accent: { bg: c.accent, fg: c.paper, border: c.accent },
    outline: { bg: c.surface, fg: c.ink, border: c.line },
    ghost: { bg: "transparent", fg: c.muted, border: "transparent" },
    danger: { bg: c.surface, fg: c.coral, border: c.line },
  }[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        {
          minHeight: size === "sm" ? 36 : 44,
          paddingHorizontal: size === "sm" ? 12 : 16,
          borderRadius: 7,
          borderWidth: 1,
          borderColor: v.border,
          backgroundColor: v.bg,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          opacity: disabled ? 0.45 : pressed ? 0.8 : 1,
          alignSelf: full ? "stretch" : "flex-start",
        },
        style,
      ]}
    >
      {icon}
      {typeof children === "string" ? (
        <RNText style={{ fontFamily: fonts.sansMedium, fontSize: size === "sm" ? 13 : 14, color: v.fg }}>{children}</RNText>
      ) : (
        children
      )}
    </Pressable>
  );
}

/** An icon-only button. `label` is required: it is the accessibility label. */
export function IconButton({ label, onPress, children, size = 44, style, disabled }: { label: string; onPress?: () => void; children: ReactNode; size?: number; style?: StyleProp<ViewStyle>; disabled?: boolean }) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
      style={({ pressed }) => [{ width: size, height: size, borderRadius: 7, alignItems: "center", justifyContent: "center", backgroundColor: pressed ? c.soft : "transparent", opacity: disabled ? 0.45 : 1 }, style]}
    >
      {children}
    </Pressable>
  );
}

export function Input({ style, ...rest }: TextInputProps) {
  const { c, fonts } = useTheme();
  const [focus, setFocus] = useState(false);
  return (
    <TextInput
      placeholderTextColor={c.faint}
      selectionColor={c.accent}
      {...rest}
      onFocus={(e) => {
        setFocus(true);
        rest.onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocus(false);
        rest.onBlur?.(e);
      }}
      style={[
        { minHeight: 44, borderRadius: 7, borderWidth: 1, borderColor: focus ? c.accent : c.line, backgroundColor: c.surface, paddingHorizontal: 12, fontFamily: fonts.sans, fontSize: 15, color: c.ink },
        style,
      ]}
    />
  );
}

export function Textarea({ style, ...rest }: TextInputProps) {
  return <Input multiline textAlignVertical="top" {...rest} style={[{ minHeight: 110, paddingTop: 10, paddingBottom: 10, lineHeight: 21 }, style]} />;
}

/** A labelled form field: label above, hint below. */
export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text size={12.5} font="sansMedium">
        {label}
      </Text>
      {children}
      {hint ? (
        <Text size={12} tone="muted">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

/** Round check for tasks and to-dos. The tap target is 44px; the circle is 20px. */
export function Check({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={() => onChange(!checked)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      hitSlop={12}
      style={{ width: 28, height: 28, alignItems: "center", justifyContent: "center" }}
    >
      <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: checked ? c.accent : c.lineStrong, backgroundColor: checked ? c.accent : "transparent", alignItems: "center", justifyContent: "center" }}>
        {checked ? <CheckMark size={12} weight="bold" color={c.paper} /> : null}
      </View>
    </Pressable>
  );
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  const { c } = useTheme();
  return <RNSwitch value={checked} onValueChange={onChange} accessibilityLabel={label} trackColor={{ true: c.accent, false: c.lineStrong }} thumbColor={c.surface} ios_backgroundColor={c.lineStrong} />;
}

/** Small segmented switch for view modes. Items are labels; value is one of them. */
export function Segmented<T extends string>({ items, value, onChange, label }: { items: readonly T[]; value: T; onChange: (v: T) => void; label: string }) {
  const { c } = useTheme();
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={{ flexDirection: "row", alignSelf: "flex-start", borderRadius: 8, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, padding: 2 }}>
      {items.map((it) => {
        const on = it === value;
        return (
          <Pressable
            key={it}
            onPress={() => onChange(it)}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            style={{ minHeight: 36, paddingHorizontal: 12, borderRadius: 6, justifyContent: "center", backgroundColor: on ? c.soft : "transparent" }}
          >
            <Text size={13} font={on ? "sansMedium" : "sans"} tone={on ? "ink" : "muted"}>
              {it}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** A modal bottom sheet with a handle, serif title and close button. */
export function Sheet({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode }) {
  const { c, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, justifyContent: "flex-end" }}>
        <Pressable accessibilityLabel="Close" onPress={onClose} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.35)" }} />
        <View style={{ maxHeight: "88%", backgroundColor: c.paper, borderTopLeftRadius: 14, borderTopRightRadius: 14, borderTopWidth: 1, borderColor: c.line, paddingBottom: insets.bottom }}>
          <View style={{ alignItems: "center", paddingTop: 8 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: c.lineStrong }} />
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, paddingLeft: 20, paddingRight: 8, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: c.line }}>
            <RNText accessibilityRole="header" style={{ flex: 1, fontFamily: fonts.serif, fontSize: 22, color: c.ink, letterSpacing: -0.2 }}>
              {title}
            </RNText>
            <IconButton label="Close" onPress={onClose}>
              <X size={18} color={c.muted} />
            </IconButton>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 20 }}>
            {children}
          </ScrollView>
          {footer ? <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderTopWidth: 1, borderTopColor: c.line }}>{footer}</View> : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
