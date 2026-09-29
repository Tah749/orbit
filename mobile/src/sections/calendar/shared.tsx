import { useState, type ReactNode } from "react";
import { Pressable, Text as RNText, View } from "react-native";
import { CaretDown, CaretLeft, CaretRight } from "phosphor-react-native";
import { parse, ymd } from "@orbit/time";
import { addDays, dayHeading, monthHeading, weekStart, weekdayLetter } from "@orbit/sections/calendar/lib";
import { useTheme } from "../../theme";
import { Button, Dot, IconButton, Label, Sheet, Text, Textarea, toast, type Tone } from "../../ui";

/* Shared by the calendar, plans and deliveries screens. Built here because the kit has no
   facts list, chip picker, date or time picker. */

/** Label and value rows under hairlines, like the web "Facts" list. */
export function Facts({ items }: { items: [string, ReactNode][] }) {
  const { c } = useTheme();
  return (
    <View style={{ borderTopWidth: 1, borderTopColor: c.line }}>
      {items.map(([k, v], i) => (
        <View key={k + i} style={{ flexDirection: "row", alignItems: "flex-start", gap: 12, minHeight: 44, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.line }}>
          <View style={{ width: 92, paddingTop: 3 }}>
            <Label>{k}</Label>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>{typeof v === "string" ? <Text size={14}>{v}</Text> : v}</View>
        </View>
      ))}
    </View>
  );
}

/** Wrapping single-choice chips. */
export function Chips<T extends string>({ items, value, onChange, label }: { items: { id: T; label: string; tone?: Tone }[]; value: T; onChange: (v: T) => void; label: string }) {
  const { c } = useTheme();
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {items.map((it) => {
        const on = it.id === value;
        return (
          <Pressable
            key={it.id}
            onPress={() => onChange(it.id)}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            style={{ minHeight: 40, paddingHorizontal: 12, borderRadius: 7, borderWidth: 1, borderColor: on ? c.ink : c.line, backgroundColor: on ? c.soft : c.surface, flexDirection: "row", alignItems: "center", gap: 7 }}
          >
            {it.tone ? <Dot tone={it.tone} size={7} /> : null}
            <Text size={13.5} font={on ? "sansMedium" : "sans"} tone={on ? "ink" : "muted"}>
              {it.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function FieldError({ children }: { children?: string }) {
  if (!children) return null;
  return (
    <Text size={12.5} tone="coral" accessibilityRole="text" style={{ marginTop: -6 }}>
      {children}
    </Text>
  );
}

/** A tappable box that looks like an input and opens a picker. */
function PickerButton({ label, value, onPress, invalid }: { label: string; value: string; onPress: () => void; invalid?: boolean }) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${value}`}
      style={({ pressed }) => ({ minHeight: 44, borderRadius: 7, borderWidth: 1, borderColor: invalid ? c.coral : c.line, backgroundColor: pressed ? c.soft : c.surface, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 })}
    >
      <Text size={15} num lines={1} style={{ flexShrink: 1 }}>
        {value}
      </Text>
      <CaretDown size={14} color={c.faint} />
    </Pressable>
  );
}

const shortDay = (s: string) => {
  const d = parse(s);
  return new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(d);
};

/** Date as YYYY-MM-DD, chosen from a month grid in a sheet. */
export function DateField({ label, value, onChange, invalid }: { label: string; value: string; onChange: (v: string) => void; invalid?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <PickerButton label={label} value={value ? shortDay(value) : "Choose a date"} onPress={() => setOpen(true)} invalid={invalid} />
      <Sheet open={open} onClose={() => setOpen(false)} title="Choose a date">
        <MonthPicker
          value={value}
          onPick={(v) => {
            onChange(v);
            setOpen(false);
          }}
        />
      </Sheet>
    </>
  );
}

function MonthPicker({ value, onPick }: { value: string; onPick: (v: string) => void }) {
  const { c, fonts } = useTheme();
  const start = value ? parse(value) : new Date();
  const [cursor, setCursor] = useState(new Date(start.getFullYear(), start.getMonth(), 1));
  const first = weekStart(cursor, true);
  const last = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
  const weeks = Math.ceil((Math.round((last.getTime() - first.getTime()) / 86_400_000) + 1) / 7);
  const days = Array.from({ length: weeks * 7 }, (_, i) => addDays(first, i));
  const today = ymd(new Date());
  const move = (n: number) => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + n, 1));
  return (
    <View>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <IconButton label="Previous month" onPress={() => move(-1)}>
          <CaretLeft size={18} color={c.ink} />
        </IconButton>
        <Text size={15} font="sansMedium" accessibilityRole="header">
          {monthHeading(cursor)}
        </Text>
        <IconButton label="Next month" onPress={() => move(1)}>
          <CaretRight size={18} color={c.ink} />
        </IconButton>
      </View>
      <View style={{ flexDirection: "row" }}>
        {days.slice(0, 7).map((d) => (
          <View key={d.getDay()} style={{ width: `${100 / 7}%`, alignItems: "center", paddingBottom: 6 }}>
            <Label>{weekdayLetter(d)}</Label>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {days.map((d) => {
          const id = ymd(d);
          const sel = id === value;
          const inMonth = d.getMonth() === cursor.getMonth();
          return (
            <Pressable key={id} onPress={() => onPick(id)} accessibilityRole="button" accessibilityLabel={dayHeading(d)} accessibilityState={{ selected: sel }} style={{ width: `${100 / 7}%`, height: 44, alignItems: "center", justifyContent: "center" }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: sel ? c.ink : "transparent" }}>
                <RNText style={{ fontFamily: id === today ? fonts.monoMedium : fonts.mono, fontSize: 14, color: sel ? c.paper : id === today ? c.accent : inMonth ? c.ink : c.faint }}>{d.getDate()}</RNText>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Time as HH:MM, chosen from hour and minute grids in a sheet. */
export function TimeField({ label, value, onChange, invalid }: { label: string; value: string; onChange: (v: string) => void; invalid?: boolean }) {
  const { c, fonts } = useTheme();
  const [open, setOpen] = useState(false);
  const [h, m] = (value || "09:00").split(":").map(Number);
  const cell = (text: string, on: boolean, onPress: () => void, key: string) => (
    <View key={key} style={{ width: `${100 / 6}%`, padding: 3 }}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={text}
        accessibilityState={{ selected: on }}
        style={{ height: 44, borderRadius: 7, borderWidth: 1, borderColor: on ? c.ink : c.line, backgroundColor: on ? c.ink : c.surface, alignItems: "center", justifyContent: "center" }}
      >
        <RNText style={{ fontFamily: fonts.mono, fontSize: 14, color: on ? c.paper : c.ink }}>{text}</RNText>
      </Pressable>
    </View>
  );
  return (
    <>
      <PickerButton label={label} value={value || "Choose a time"} onPress={() => setOpen(true)} invalid={invalid} />
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={label}
        footer={
          <Button variant="primary" onPress={() => setOpen(false)}>
            Done
          </Button>
        }
      >
        <Label style={{ marginBottom: 8 }}>Hour</Label>
        <View style={{ flexDirection: "row", flexWrap: "wrap", marginHorizontal: -3, marginBottom: 20 }}>{Array.from({ length: 24 }, (_, i) => cell(pad(i), i === h, () => onChange(`${pad(i)}:${pad(m || 0)}`), `h${i}`))}</View>
        <Label style={{ marginBottom: 8 }}>Minute</Label>
        <View style={{ flexDirection: "row", flexWrap: "wrap", marginHorizontal: -3 }}>{Array.from({ length: 12 }, (_, i) => cell(pad(i * 5), i * 5 === m, () => onChange(`${pad(h || 0)}:${pad(i * 5)}`), `m${i}`))}</View>
      </Sheet>
    </>
  );
}

/** A note that reads as text and edits in place. */
export function NoteEditor({ label, value, placeholder, onSave }: { label: string; value?: string; placeholder: string; onSave: (v: string | undefined) => void }) {
  const [draft, setDraft] = useState(value ?? "");
  const [editing, setEditing] = useState(false);
  const save = () => {
    const v = draft.trim();
    onSave(v || undefined);
    setDraft(v);
    setEditing(false);
    toast(v ? "Note saved" : "Note removed");
  };
  return (
    <View>
      <Label style={{ marginBottom: 8 }}>{label}</Label>
      {editing ? (
        <View style={{ gap: 10 }}>
          <Textarea autoFocus accessibilityLabel={label} value={draft} onChangeText={setDraft} placeholder={placeholder} />
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Button variant="primary" size="sm" onPress={save}>
              Save note
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onPress={() => {
                setDraft(value ?? "");
                setEditing(false);
              }}
            >
              Cancel
            </Button>
          </View>
        </View>
      ) : value ? (
        <Pressable onPress={() => (setDraft(value), setEditing(true))} accessibilityRole="button" accessibilityLabel={`Edit ${label.toLowerCase()}`}>
          <Text size={14} style={{ lineHeight: 21 }}>
            {value}
          </Text>
          <Text size={12.5} tone="muted" style={{ marginTop: 6, textDecorationLine: "underline" }}>
            Edit note
          </Text>
        </Pressable>
      ) : (
        <Button
          size="sm"
          onPress={() => {
            setDraft("");
            setEditing(true);
          }}
        >
          Add a note
        </Button>
      )}
    </View>
  );
}

/** A reference or tracking code. Text is selectable so it can be copied with a long press. */
export function CodeText({ value, size = 20 }: { value: string; size?: number }) {
  const { c, fonts } = useTheme();
  return (
    <View>
      <RNText selectable style={{ fontFamily: fonts.mono, fontSize: size, letterSpacing: 1, color: c.ink }}>
        {value}
      </RNText>
    </View>
  );
}

/** A row that links to another item: kind label, title, meta. */
export function LinkRow({ kind, title, meta, onPress }: { kind: string; title: string; meta?: string; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 12, minHeight: 48, paddingVertical: 8, paddingHorizontal: 2, borderBottomWidth: 1, borderBottomColor: c.line, backgroundColor: pressed ? c.soft : "transparent" })}>
      <View style={{ width: 68 }}>
        <Label tone="faint">{kind}</Label>
      </View>
      <Text size={14} lines={1} style={{ flex: 1 }}>
        {title}
      </Text>
      {meta ? (
        <Text size={12} tone="muted" num>
          {meta}
        </Text>
      ) : null}
      <CaretRight size={13} color={c.faint} />
    </Pressable>
  );
}
