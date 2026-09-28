import { useEffect, useState, type FormEvent } from "react";
import { db, newId, useDB } from "../../store";
import type { Booking, BookingKind } from "../../data/plans";
import { go } from "../../router";
import { Button, Field, Input, Select, Sheet, toast } from "../../ui";
import { on, parse } from "../../time";
import { kinds } from "./lib";

const blank = { kind: "restaurant" as BookingKind, title: "", provider: "", date: on(1), time: "19:30", ref: "", tripId: "" };

export function AddBooking({ open, onClose }: { open: boolean; onClose: () => void }) {
  const trips = useDB((d) => d.trips.filter((t) => t.end >= on(0)));
  const [f, setF] = useState(blank);
  const [tried, setTried] = useState(false);
  useEffect(() => {
    if (open) {
      setF(blank);
      setTried(false);
    }
  }, [open]);
  const set = (patch: Partial<typeof f>) => setF((x) => ({ ...x, ...patch }));
  const ok = f.title.trim() && f.date;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (!ok) return;
    const start = parse(`${f.date}T${f.time || "00:00"}:00`).toISOString();
    const b: Booking = {
      id: newId("bk"),
      kind: f.kind,
      title: f.title.trim(),
      provider: f.provider.trim(),
      start,
      ref: f.ref.trim(),
      details: [],
      tripId: f.tripId || undefined,
      status: "confirmed",
      source: "manual",
    };
    db.insert("bookings", b);
    onClose();
    toast("Booking added", { label: "Open", run: () => go(`plans/${b.id}`) });
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Add a booking"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="add-booking">
            Add booking
          </Button>
        </>
      }
    >
      <form id="add-booking" onSubmit={submit} className="grid gap-5" noValidate>
        <p className="text-[13.5px] leading-relaxed text-muted">Orbit adds bookings from confirmation emails. Add one yourself if it came another way.</p>
        <Field label="Kind">
          <Select value={f.kind} onChange={(e) => set({ kind: e.target.value as BookingKind })}>
            {(Object.keys(kinds) as BookingKind[]).map((k) => (
              <option key={k} value={k}>
                {kinds[k].name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="What is it?" hint={tried && !f.title.trim() ? "Give it a name, like “Dinner at Olmo”." : undefined}>
          <Input value={f.title} onChange={(e) => set({ title: e.target.value })} placeholder="Dinner at Olmo" aria-invalid={tried && !f.title.trim()} />
        </Field>
        <Field label="Booked with">
          <Input value={f.provider} onChange={(e) => set({ provider: e.target.value })} placeholder="OpenTable, the venue, an airline" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Date">
            <Input type="date" value={f.date} onChange={(e) => set({ date: e.target.value })} />
          </Field>
          <Field label="Time">
            <Input type="time" value={f.time} onChange={(e) => set({ time: e.target.value })} />
          </Field>
        </div>
        <Field label="Reference">
          <Input value={f.ref} onChange={(e) => set({ ref: e.target.value })} className="font-mono" placeholder="Optional" />
        </Field>
        <Field label="Trip">
          <Select value={f.tripId} onChange={(e) => set({ tripId: e.target.value })}>
            <option value="">Not part of a trip</option>
            {trips.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </Select>
        </Field>
      </form>
    </Sheet>
  );
}
