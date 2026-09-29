import { Pressable, View } from "react-native";
import type { Booking, Trip } from "@orbit/data/plans";
import { parse, shortDate, time, ymd, dayLabel, inDays } from "@orbit/time";
import { countdown, joinNames, openTaskFor, prompts, refLine, tripDates } from "@orbit/sections/plans/lib";
import { useRouter } from "expo-router";
import { CaretDown } from "phosphor-react-native";
import { useTheme } from "../../theme";
import { useDB } from "../../store";
import { Button, Dot, Label, Source, Text } from "../../ui";
import { CodeText } from "../calendar/shared";
import { kinds } from "./kinds";
import { Itinerary, StepRow } from "./Itinerary";
import { addReminder } from "./BookingBody";

/** "Before you go": check-in, seats, check-out. Each can become a task. */
export function Prompts({ list, onOpen }: { list: ReturnType<typeof prompts>; onOpen: (id: string) => void }) {
  const { c } = useTheme();
  const router = useRouter();
  const tasks = useDB((d) => d.tasks);
  if (!list.length) return null;
  return (
    <View>
      <Label style={{ marginBottom: 8 }}>Before you go</Label>
      <View style={{ borderTopWidth: 1, borderTopColor: c.line }}>
        {list.map((p) => {
          const t = openTaskFor(tasks, p.booking.id, p.task.title);
          return (
            <View key={p.key} style={{ flexDirection: "row", alignItems: "center", gap: 12, minHeight: 60, paddingVertical: 10, paddingHorizontal: 2, borderBottomWidth: 1, borderBottomColor: c.line }}>
              <Dot tone="warn" />
              <Pressable onPress={() => onOpen(p.booking.id)} accessibilityRole="button" style={{ flex: 1, minWidth: 0, gap: 2 }}>
                <Text size={14} font="sansMedium">
                  {p.title}
                </Text>
                <Text size={12.5} tone="muted">
                  {p.detail}
                </Text>
                <Source id={p.booking.source} />
              </Pressable>
              {t ? (
                <Button variant="ghost" size="sm" onPress={() => router.push("/tasks")}>
                  In tasks
                </Button>
              ) : (
                <Button size="sm" onPress={() => addReminder(p.booking, p.task)}>
                  Remind me
                </Button>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

/** One row per reference: a return flight often shares the outbound's. */
export function References({ list }: { list: Booking[] }) {
  const { c } = useTheme();
  const seen = new Set<string>();
  const rows = list.filter((b) => b.status !== "cancelled" && b.ref && !seen.has(b.ref) && seen.add(b.ref));
  if (!rows.length) return null;
  return (
    <View>
      <Label style={{ marginBottom: 8 }}>References</Label>
      <View style={{ borderTopWidth: 1, borderTopColor: c.line }}>
        {rows.map((b) => (
          <View key={b.id} style={{ flexDirection: "row", alignItems: "center", gap: 12, minHeight: 52, paddingVertical: 8, paddingHorizontal: 2, borderBottomWidth: 1, borderBottomColor: c.line }}>
            <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
              <Text size={13} tone="muted" lines={1}>
                {b.kind === "flight" || b.kind === "train" ? b.provider : b.title}
              </Text>
              <Source id={b.source} />
            </View>
            <CodeText value={b.ref} size={15} />
          </View>
        ))}
      </View>
      <Text size={12} tone="faint" style={{ marginTop: 6 }}>
        Press and hold a reference to copy it.
      </Text>
    </View>
  );
}

export function NextTrip({ trip, list, onOpen, onOpenTrip }: { trip: Trip; list: Booking[]; onOpen: (id: string) => void; onOpenTrip: () => void }) {
  const { fonts } = useTheme();
  const soon = prompts(list);
  return (
    <View style={{ gap: 26 }}>
      <View>
        <Label>Next up</Label>
        <Text size={34} accessibilityRole="header" style={{ fontFamily: fonts.serif, lineHeight: 38, letterSpacing: -0.6, marginTop: 8 }}>
          {countdown(trip)}
        </Text>
        <Text size={13.5} tone="muted" style={{ marginTop: 8 }}>
          {tripDates(trip)} · {joinNames(trip.travellers)} · {trip.destination}
        </Text>
        <Button size="sm" onPress={onOpenTrip} style={{ marginTop: 14 }}>
          Open trip
        </Button>
      </View>
      <Prompts list={soon} onOpen={onOpen} />
      <References list={list} />
      <Itinerary bookings={list} tripStart={trip.start} onOpen={onOpen} />
    </View>
  );
}

export function LaterTrip({ trip, list, open, onToggle, onOpen, onOpenTrip }: { trip: Trip; list: Booking[]; open: boolean; onToggle: () => void; onOpen: (id: string) => void; onOpenTrip: () => void }) {
  const { c, fonts } = useTheme();
  const kindsIn = [...new Set(list.map((b) => kinds[b.kind].name.toLowerCase()))];
  const summary = `${list.length} ${list.length === 1 ? "booking" : "bookings"}${kindsIn.length ? `: ${joinNames(kindsIn)}` : ""}`;
  return (
    <View style={{ borderBottomWidth: 1, borderBottomColor: c.line }}>
      <Pressable onPress={onToggle} accessibilityRole="button" accessibilityState={{ expanded: open }} style={({ pressed }) => ({ flexDirection: "row", alignItems: "flex-start", gap: 14, paddingVertical: 14, paddingHorizontal: 2, backgroundColor: pressed ? c.soft : "transparent" })}>
        <View style={{ width: 52, paddingTop: 5 }}>
          <Label>{shortDate(trip.start)}</Label>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text size={22} style={{ fontFamily: fonts.serif, lineHeight: 26 }}>
            {trip.title}
            {trip.note ? <Text size={22} tone="muted" style={{ fontFamily: fonts.serif }}> · {trip.note}</Text> : null}
          </Text>
          <Text size={12.5} tone="muted" style={{ marginTop: 4 }}>
            {tripDates(trip)} · {summary}
          </Text>
        </View>
        <View style={{ paddingTop: 8, transform: [{ rotate: open ? "180deg" : "0deg" }] }}>
          <CaretDown size={16} color={c.faint} />
        </View>
      </Pressable>
      {open && (
        <View style={{ paddingBottom: 20, gap: 14 }}>
          {list.length ? <Itinerary bookings={list} tripStart={trip.start} onOpen={onOpen} /> : <Text size={13.5} tone="muted">No bookings in this trip yet.</Text>}
          <Button size="sm" onPress={onOpenTrip}>
            Open trip
          </Button>
        </View>
      )}
    </View>
  );
}

export function OtherBookings({ list, onOpen }: { list: Booking[]; onOpen: (id: string) => void }) {
  const { c, fonts } = useTheme();
  const groups: { day: string; items: Booking[] }[] = [];
  for (const b of list) {
    const day = ymd(parse(b.start));
    const x = groups.find((y) => y.day === day);
    if (x) x.items.push(b);
    else groups.push({ day, items: [b] });
  }
  if (!list.length)
    return (
      <View style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: c.line, paddingVertical: 16 }}>
        <Text size={13.5} tone="muted">
          Nothing else booked. Restaurant and ticket confirmations will show up here.
        </Text>
      </View>
    );
  return (
    <View>
      {groups.map((g) => (
        <View key={g.day} style={{ marginBottom: 18 }}>
          <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: c.ink, paddingBottom: 8 }}>
            <Text size={18} style={{ fontFamily: fonts.serif }}>
              {dayLabel(g.day)}
            </Text>
            <Label>{inDays(g.day)}</Label>
          </View>
          {g.items.map((b) => (
            <StepRow key={b.id} step={{ booking: b, time: time(b.start), title: b.title, sub: refLine(b) || kinds[b.kind].name }} onOpen={onOpen} />
          ))}
        </View>
      ))}
    </View>
  );
}

export function PastList({ list, trips, onOpen, all, onToggleAll }: { list: Booking[]; trips: Trip[]; onOpen: (id: string) => void; all: boolean; onToggleAll: () => void }) {
  const { c } = useTheme();
  const shown = all ? list : list.slice(0, 4);
  return (
    <View>
      <View style={{ borderTopWidth: 1, borderTopColor: c.line }}>
        {shown.map((b) => {
          const K = kinds[b.kind];
          const trip = trips.find((t) => t.id === b.tripId);
          return (
            <Pressable key={b.id} onPress={() => onOpen(b.id)} accessibilityRole="button" style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 12, minHeight: 56, paddingVertical: 10, paddingHorizontal: 2, borderBottomWidth: 1, borderBottomColor: c.line, backgroundColor: pressed ? c.soft : "transparent" })}>
              <View style={{ width: 52 }}>
                <Text size={12} font="mono" num tone="faint">
                  {shortDate(b.start)}
                </Text>
              </View>
              <K.icon size={15} color={c.faint} />
              <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
                <Text size={13.5} tone="muted" lines={1}>
                  {b.title}
                  {trip ? ` · ${trip.title}` : ""}
                </Text>
                <Source id={b.source} />
              </View>
            </Pressable>
          );
        })}
      </View>
      {list.length > 4 && (
        <Button variant="ghost" size="sm" onPress={onToggleAll} style={{ marginTop: 6 }}>
          {all ? "Show fewer" : `Show all ${list.length}`}
        </Button>
      )}
    </View>
  );
}

