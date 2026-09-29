import { Pressable, View } from "react-native";
import type { Booking } from "@orbit/data/plans";
import { daysFrom, longDate, relDay } from "@orbit/time";
import { itinerary, statusText, statusTone, type Step } from "@orbit/sections/plans/lib";
import { useTheme } from "../../theme";
import { Label, Source, Tag, Text } from "../../ui";
import { kinds } from "./kinds";

/** Quiet text when all is well, a tag when something changed. */
export function Status({ b }: { b: Booking }) {
  if (b.status === "confirmed") return <Label tone="faint">{statusText[b.status]}</Label>;
  return <Tag tone={statusTone[b.status]}>{statusText[b.status]}</Tag>;
}

/** One line of a travel document: time, what, who and the reference, status, source. */
export function StepRow({ step, onOpen }: { step: Pick<Step, "time" | "qualifier" | "title" | "sub" | "booking">; onOpen: (id: string) => void }) {
  const { c } = useTheme();
  const b = step.booking;
  const K = kinds[b.kind];
  const off = b.status === "cancelled";
  return (
    <Pressable
      onPress={() => onOpen(b.id)}
      accessibilityRole="button"
      accessibilityLabel={`${step.time} ${step.title}, ${statusText[b.status]}`}
      style={({ pressed }) => ({ flexDirection: "row", alignItems: "flex-start", gap: 12, minHeight: 56, paddingVertical: 12, paddingHorizontal: 2, borderBottomWidth: 1, borderBottomColor: c.line, backgroundColor: pressed ? c.soft : "transparent" })}
    >
      <View style={{ width: 46 }}>
        {step.qualifier ? <Label tone="faint">{step.qualifier}</Label> : null}
        <Text size={13.5} font="mono" num>
          {step.time}
        </Text>
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <K.icon size={15} color={c.faint} />
          <Text size={14.5} lines={2} tone={off ? "muted" : "ink"} style={{ flexShrink: 1, textDecorationLine: off ? "line-through" : "none" }}>
            {step.title}
          </Text>
        </View>
        {step.sub ? (
          <Text size={12.5} tone="muted" lines={1}>
            {step.sub}
          </Text>
        ) : null}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <Source id={b.source} />
          <Status b={b} />
        </View>
      </View>
    </Pressable>
  );
}

/** A trip's bookings, day by day, set like a printed itinerary. */
export function Itinerary({ bookings, tripStart, onOpen }: { bookings: Booking[]; tripStart: string; onOpen: (id: string) => void }) {
  const { c, fonts } = useTheme();
  const days = itinerary(bookings);
  return (
    <View style={{ gap: 28 }}>
      {days.map((d) => {
        const n = daysFrom(d.day) - daysFrom(tripStart) + 1;
        const near = Math.abs(daysFrom(d.day)) <= 1;
        return (
          <View key={d.day}>
            <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 12, borderBottomWidth: 1, borderBottomColor: c.ink, paddingBottom: 8 }}>
              <Text size={20} style={{ fontFamily: fonts.serif, flexShrink: 1, letterSpacing: -0.2 }} accessibilityRole="header">
                {longDate(d.day)}
              </Text>
              <Label>
                {near ? `${relDay(d.day)} · ` : ""}Day {n}
              </Label>
            </View>
            {d.steps.map((s) => (
              <StepRow key={s.key} step={s} onOpen={onOpen} />
            ))}
          </View>
        );
      })}
    </View>
  );
}
