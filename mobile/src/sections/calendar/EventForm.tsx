import { useState } from "react";
import { View } from "react-native";
import type { CalendarId } from "@orbit/data/calendar";
import { Button, Field, Input, Switch, Text, Textarea } from "../../ui";
import { useTheme } from "../../theme";
import { calendarList, validate, type Draft, type Errors } from "./draft";
import { calTone } from "./tone";
import { Chips, DateField, FieldError, TimeField } from "./shared";

/** Title, date, times, calendar, location and notes. Used for new events and for editing. */
export function EventForm({ initial, submitLabel, onSubmit, onCancel }: { initial: Draft; submitLabel: string; onSubmit: (d: Draft) => void; onCancel: () => void }) {
  const { c } = useTheme();
  const [d, setD] = useState(initial);
  const [errors, setErrors] = useState<Errors>({});
  const set = (patch: Partial<Draft>) => {
    const next = { ...d, ...patch };
    setD(next);
    // Once someone has tried to save, keep the messages in step with what they change.
    if (Object.keys(errors).length) setErrors(validate(next));
  };
  const submit = () => {
    const e = validate(d);
    setErrors(e);
    if (!Object.keys(e).length) onSubmit(d);
  };
  return (
    <View style={{ gap: 18 }}>
      <Field label="Title">
        <Input value={d.title} onChangeText={(v) => set({ title: v })} placeholder="Dinner with Ella" autoFocus={!initial.title} returnKeyType="done" style={errors.title ? { borderColor: c.coral } : undefined} accessibilityLabel="Title" />
      </Field>
      <FieldError>{errors.title}</FieldError>

      <Field label="Date">
        <DateField label="Date" value={d.date} onChange={(v) => set({ date: v })} invalid={!!errors.date} />
      </Field>
      <FieldError>{errors.date}</FieldError>

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 44 }}>
        <Text size={14.5}>All day</Text>
        <Switch label="All day" checked={d.allDay} onChange={(v) => set({ allDay: v })} />
      </View>

      {!d.allDay && (
        <>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Field label="Starts">
                <TimeField label="Starts" value={d.start} onChange={(v) => set({ start: v })} />
              </Field>
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Ends">
                <TimeField label="Ends" value={d.end} onChange={(v) => set({ end: v })} invalid={!!errors.end} />
              </Field>
            </View>
          </View>
          <FieldError>{errors.end}</FieldError>
        </>
      )}

      <Field label="Calendar">
        <Chips<CalendarId> label="Calendar" value={d.calendar} onChange={(v) => set({ calendar: v })} items={calendarList.map((cal) => ({ id: cal.id, label: cal.name, tone: calTone[cal.id] }))} />
      </Field>
      <Field label="Location">
        <Input value={d.location} onChangeText={(v) => set({ location: v })} placeholder="Optional" accessibilityLabel="Location" />
      </Field>
      <Field label="Notes">
        <Textarea value={d.notes} onChangeText={(v) => set({ notes: v })} placeholder="Optional" accessibilityLabel="Notes" />
      </Field>

      <View style={{ flexDirection: "row", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
        <Button variant="ghost" onPress={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" onPress={submit}>
          {submitLabel}
        </Button>
      </View>
    </View>
  );
}
