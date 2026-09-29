import { useState, type ReactNode } from "react";
import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import type { Booking } from "@orbit/data/plans";
import type { Task } from "@orbit/data/tasks";
import { relDay, stamp, time } from "@orbit/time";
import { dayPhrase, dayWord, openTaskFor, reminderFor, statusText, statusTone, whenText } from "@orbit/sections/plans/lib";
import { useTheme } from "../../theme";
import { db, newId, useDB } from "../../store";
import { Button, Label, Source, Tag, Text, toast } from "../../ui";
import { CodeText, Facts, LinkRow, NoteEditor } from "../calendar/shared";
import { kinds } from "./kinds";

export function addReminder(b: Booking, r: { title: string; due: string }) {
  const task: Task = { id: newId("tk"), title: r.title, due: r.due, done: false, list: "personal", from: { kind: "booking", id: b.id }, source: "manual", createdAt: new Date().toISOString() };
  db.insert("tasks", task);
  toast(`Added to tasks for ${dayWord(r.due)}`, { label: "Undo", run: () => db.remove("tasks", task.id) });
}

function Related({ id }: { id: string }) {
  const { c } = useTheme();
  const router = useRouter();
  const mails = useDB((d) => d.messages.filter((m) => m.links?.some((l) => l.kind === "booking" && l.id === id)));
  const events = useDB((d) => d.events.filter((e) => e.links?.some((l) => l.kind === "booking" && l.id === id)));
  const tasks = useDB((d) => d.tasks.filter((t) => t.from?.kind === "booking" && t.from.id === id));
  const rows = [
    ...mails.map((m) => ({ key: m.id, kind: "Email", text: m.subject, meta: stamp(m.date), path: `/inbox/${m.id}` })),
    ...events.map((e) => ({ key: e.id, kind: "Calendar", text: e.title, meta: `${relDay(e.start)} ${time(e.start)}`, path: `/event/${e.id}` })),
    ...tasks.map((t) => ({ key: t.id, kind: t.done ? "Task, done" : "Task", text: t.title, meta: t.due ? relDay(t.due) : "", path: "/tasks" })),
  ];
  if (!rows.length) return null;
  return (
    <View>
      <Label style={{ marginBottom: 8 }}>Related</Label>
      <View style={{ borderTopWidth: 1, borderTopColor: c.line }}>
        {rows.map((r) => (
          <LinkRow key={r.key} kind={r.kind} title={r.text} meta={r.meta} onPress={() => router.push(r.path)} />
        ))}
      </View>
    </View>
  );
}

/** Everything about one booking. Used in the sheet on a trip and as the page for a stand-alone booking. */
export function BookingBody({ b, hideTrip }: { b: Booking; hideTrip?: boolean }) {
  const router = useRouter();
  const trip = useDB((d) => (b.tripId ? d.trips.find((t) => t.id === b.tripId) : undefined));
  const tasks = useDB((d) => d.tasks);
  const K = kinds[b.kind];
  const r = reminderFor(b);
  const existing = openTaskFor(tasks, b.id, r.title);
  const cancelled = b.status === "cancelled";
  const facts: [string, ReactNode][] = [...(b.provider ? ([["Provider", b.provider]] as [string, ReactNode][]) : []), ...b.details, ["Status", statusText[b.status]], ["From", <Source key="s" id={b.source} />]];
  return (
    <View style={{ gap: 26 }}>
      <View>
        <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <KIcon b={b} />
            <Label>{K.name}</Label>
          </View>
          <Tag tone={statusTone[b.status]}>{statusText[b.status]}</Tag>
        </View>
        <Text size={15} num style={{ marginTop: 12 }}>
          {whenText(b)}
        </Text>
        {trip && !hideTrip ? (
          <Pressable onPress={() => router.push(`/plans/${trip.id}`)} accessibilityRole="link" style={{ minHeight: 40, justifyContent: "center" }}>
            <Text size={13} tone="muted" style={{ textDecorationLine: "underline" }}>
              Part of your {trip.title} trip
            </Text>
          </Pressable>
        ) : null}
      </View>

      {b.ref ? (
        <View>
          <Label style={{ marginBottom: 6 }}>Reference</Label>
          <CodeText value={b.ref} />
          <Text size={12} tone="faint" style={{ marginTop: 4 }}>
            Press and hold to copy.
          </Text>
        </View>
      ) : null}

      <Facts items={facts} />

      {!cancelled && !existing ? (
        <Text size={12.5} tone="muted" style={{ marginTop: -10 }}>
          Add to tasks reminds you: “{r.title}”, {dayPhrase(r.due)}.
        </Text>
      ) : null}

      <NoteEditor label="Your notes" value={b.notes} placeholder="Door codes, who's collecting the keys, what to pack" onSave={(v) => db.patch("bookings", b.id, { notes: v })} />
      <Related id={b.id} />
    </View>
  );
}

function KIcon({ b }: { b: Booking }) {
  const { c } = useTheme();
  const K = kinds[b.kind];
  return <K.icon size={14} color={c.faint} />;
}

/** Cancel and add-to-tasks actions. */
export function BookingActions({ b, fill }: { b: Booking; fill?: boolean }) {
  const router = useRouter();
  const tasks = useDB((d) => d.tasks);
  const [confirming, setConfirming] = useState(false);
  const r = reminderFor(b);
  const existing = openTaskFor(tasks, b.id, r.title);
  const cancelled = b.status === "cancelled";

  const cancel = () => {
    const prev = b.status;
    db.patch("bookings", b.id, { status: "cancelled" });
    setConfirming(false);
    toast("Booking marked as cancelled", { label: "Undo", run: () => db.patch("bookings", b.id, { status: prev }) });
  };

  if (confirming)
    return (
      <View style={[{ gap: 10 }, fill && { flex: 1 }]}>
        <Text size={13.5} tone="muted">
          Mark this as cancelled in Orbit?
        </Text>
        <View style={{ flexDirection: "row", gap: 8, justifyContent: "flex-end" }}>
          <Button variant="ghost" onPress={() => setConfirming(false)}>
            Keep it
          </Button>
          <Button variant="danger" onPress={cancel}>
            Yes, cancel
          </Button>
        </View>
      </View>
    );
  return (
    <View style={[{ flexDirection: "row", gap: 8, alignItems: "center", flexWrap: "wrap" }, fill && { flex: 1 }]}>
      {!cancelled && (
        <Button variant="danger" onPress={() => setConfirming(true)}>
          Cancel booking
        </Button>
      )}
      <View style={{ marginLeft: "auto" }}>
        {existing ? (
          <Button onPress={() => router.push("/tasks")}>In your tasks</Button>
        ) : (
          !cancelled && (
            <Button variant="primary" onPress={() => addReminder(b, r)}>
              Add to tasks
            </Button>
          )
        )}
      </View>
    </View>
  );
}
