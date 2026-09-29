import { useEffect, useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import type { Booking, BookingKind } from "@orbit/data/plans";
import { on, parse } from "@orbit/time";
import { db, newId, useDB } from "../../store";
import { Button, Field, Input, Sheet, Text, toast } from "../../ui";
import { Chips, DateField, TimeField } from "../calendar/shared";
import { kinds } from "./kinds";

const blank = { kind: "restaurant" as BookingKind, title: "", provider: "", date: on(1), time: "19:30", ref: "", tripId: "" };

export function AddBooking({ open, onClose, tripId }: { open: boolean; onClose: () => void; tripId?: string }) {
  const router = useRouter();
  const trips = useDB((d) => d.trips.filter((t) => t.end >= on(0)));
  const [f, setF] = useState({ ...blank, tripId: tripId ?? "" });
  const [tried, setTried] = useState(false);
  useEffect(() => {
    if (open) {
      setF({ ...blank, tripId: tripId ?? "" });
      setTried(false);
    }
  }, [open, tripId]);
  const set = (patch: Partial<typeof f>) => setF((x) => ({ ...x, ...patch }));
  const ok = !!f.title.trim() && !!f.date;

  const submit = () => {
    setTried(true);
    if (!ok) return;
    const b: Booking = {
      id: newId("bk"),
      kind: f.kind,
      title: f.title.trim(),
      provider: f.provider.trim(),
      start: parse(`${f.date}T${f.time || "00:00"}:00`).toISOString(),
      ref: f.ref.trim(),
      details: [],
      tripId: f.tripId || undefined,
      status: "confirmed",
      source: "manual",
    };
    db.insert("bookings", b);
    onClose();
    toast("Booking added", { label: "Open", run: () => router.push(`/plans/${b.id}`) });
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Add a booking"
      footer={
        <>
          <Button variant="ghost" onPress={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onPress={submit}>
            Add booking
          </Button>
        </>
      }
    >
      <View style={{ gap: 20 }}>
        <Text size={13.5} tone="muted">
          Orbit adds bookings from confirmation emails. Add one yourself if it came another way.
        </Text>
        <Field label="Kind">
          <Chips<BookingKind> label="Kind" value={f.kind} onChange={(v) => set({ kind: v })} items={(Object.keys(kinds) as BookingKind[]).map((k) => ({ id: k, label: kinds[k].name }))} />
        </Field>
        <Field label="What is it?" hint={tried && !f.title.trim() ? "Give it a name, like “Dinner at Olmo”." : undefined}>
          <Input value={f.title} onChangeText={(v) => set({ title: v })} placeholder="Dinner at Olmo" accessibilityLabel="What is it?" />
        </Field>
        <Field label="Booked with">
          <Input value={f.provider} onChangeText={(v) => set({ provider: v })} placeholder="OpenTable, the venue, an airline" accessibilityLabel="Booked with" />
        </Field>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 3 }}>
            <Field label="Date">
              <DateField label="Date" value={f.date} onChange={(v) => set({ date: v })} />
            </Field>
          </View>
          <View style={{ flex: 2 }}>
            <Field label="Time">
              <TimeField label="Time" value={f.time} onChange={(v) => set({ time: v })} />
            </Field>
          </View>
        </View>
        <Field label="Reference">
          <Input value={f.ref} onChangeText={(v) => set({ ref: v })} placeholder="Optional" autoCapitalize="characters" accessibilityLabel="Reference" />
        </Field>
        <Field label="Trip">
          <Chips<string> label="Trip" value={f.tripId} onChange={(v) => set({ tripId: v })} items={[{ id: "", label: "Not part of a trip" }, ...trips.map((t) => ({ id: t.id, label: t.title }))]} />
        </Field>
      </View>
    </Sheet>
  );
}
