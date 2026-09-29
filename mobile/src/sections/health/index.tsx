import { useState } from "react";
import { View } from "react-native";
import { Plus, Trash } from "phosphor-react-native";
import { daysFrom, on, relDay, time } from "@orbit/time";
import type { Workout } from "@orbit/data/life";
import { db, newId, useDB } from "../../store";
import { Bars, Button, Empty, Field, IconButton, Input, Label, List, Page, Row, Screen, Section, Segmented, Sheet, Source, Text, useSimulatedLoad, SkeletonList } from "../../ui";
import { avg, compare, hm, kindLabel, summary, weeks } from "./words";

function Metrics() {
  const daily = useDB((d) => d.daily);
  const { now, before, all } = weeks(daily);
  if (!all.length) return <Empty title="No activity yet">Steps, sleep and heart rate appear here once Apple Health has something to share.</Empty>;
  const today = all.length - 1;
  const a = (k: "steps" | "sleepMin" | "restingHr" | "activeMin", xs = now) => avg(xs.map((d) => d[k]));

  return (
    <View style={{ gap: 20 }}>
      <MetricBlock
        label="Steps"
        value={Math.round(a("steps") / 10) * 10}
        unit="a day this week"
        note={compare(a("steps"), a("steps", before), { unit: (n) => `About ${Math.round(n / 100) * 100}`, per: "a day", same: 250, less: "fewer" })}
        values={all.map((d) => d.steps)}
        highlight={today}
      />
      <MetricBlock
        label="Sleep"
        value={hm(a("sleepMin"))}
        unit="a night this week"
        note={compare(a("sleepMin"), a("sleepMin", before), { unit: (n) => `About ${Math.round(n)} minutes`, per: "a night", same: 10 })}
        values={all.map((d) => d.sleepMin)}
        highlight={today}
      />
      <MetricBlock
        label="Resting heart rate"
        value={Math.round(a("restingHr"))}
        unit="bpm on average"
        note={compare(a("restingHr"), a("restingHr", before), { unit: (n) => `${Math.round(n)} bpm`, per: "on average", same: 1, more: "higher", less: "lower" })}
        values={all.map((d) => d.restingHr)}
        highlight={today}
      />
      <MetricBlock
        label="Active minutes"
        value={Math.round(a("activeMin"))}
        unit="minutes a day"
        note={compare(a("activeMin"), a("activeMin", before), { unit: (n) => `About ${Math.round(n)} minutes`, per: "a day", same: 3 })}
        values={all.map((d) => d.activeMin)}
        highlight={today}
      />
    </View>
  );
}

function MetricBlock({ label, value, unit, note, values, highlight }: { label: string; value: number | string; unit: string; note: string; values: number[]; highlight: number }) {
  return (
    <View style={{ borderTopWidth: 1, borderTopColor: "#DDD7CD", paddingTop: 14 }}>
      <Label>{label}</Label>
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8, marginTop: 8 }}>
        <Text size={26} font="sansMedium" num>
          {value}
        </Text>
        <Text size={13} tone="muted">
          {unit}
        </Text>
      </View>
      <Text size={12.5} tone="muted" style={{ marginTop: 6 }}>
        {note}
      </Text>
      <View style={{ marginTop: 12 }}>
        <Bars values={values} highlight={highlight} height={56} />
      </View>
    </View>
  );
}

const hasDistance = (k: Workout["kind"]) => k === "run" || k === "ride" || k === "walk" || k === "swim";
const nowHHMM = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

function LogSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [kind, setKind] = useState<Workout["kind"]>("run");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(on(0));
  const [start, setStart] = useState(nowHHMM());
  const [minutes, setMinutes] = useState("");
  const [km, setKm] = useState("");
  const [error, setError] = useState("");

  const reset = () => {
    setTitle("");
    setDate(on(0));
    setStart(nowHHMM());
    setMinutes("");
    setKm("");
    setError("");
  };

  const submit = () => {
    const mins = Math.round(Number(minutes));
    if (!mins || mins < 1 || mins > 1440) return setError("Add how long it lasted, in minutes.");
    const when = new Date(`${date}T${start || "12:00"}`);
    if (Number.isNaN(when.getTime())) return setError("Check the date and time.");
    if (when.getTime() > Date.now() + 60_000) return setError("That time is still to come. Log workouts once they're done.");
    const distance = hasDistance(kind) && km ? Math.round(Number(km) * 100) / 100 : undefined;
    const w: Workout = {
      id: newId("wo"),
      date: when.toISOString(),
      kind,
      title: title.trim() || kindLabel[kind][0],
      minutes: mins,
      ...(distance && distance > 0 ? { km: distance } : {}),
      source: "manual",
    };
    db.insert("workouts", w);
    reset();
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Log a workout"
      footer={
        <>
          <Button variant="ghost" onPress={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onPress={submit} key="save">
            Save workout
          </Button>
        </>
      }
    >
      <View style={{ gap: 16 }}>
        <Field label="Kind">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {(Object.keys(kindLabel) as Workout["kind"][]).map((k) => (
              <Button key={k} variant={kind === k ? "primary" : "outline"} onPress={() => setKind(k)} size="sm">
                {kindLabel[k][0]}
              </Button>
            ))}
          </View>
        </Field>
        <Field label="Title" hint="Optional">
          <Input value={title} onChangeText={setTitle} placeholder={kind === "run" ? "Morning run" : kind === "strength" ? "Full body" : kindLabel[kind][0]} />
        </Field>
        <View style={{ gap: 12 }}>
          <View style={{ gap: 12, flexDirection: "row" }}>
            <View style={{ flex: 1 }}>
              <Field label="Date">
                <Input value={date} onChangeText={setDate} />
              </Field>
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Start time">
                <Input value={start} onChangeText={setStart} />
              </Field>
            </View>
          </View>
        </View>
        <View style={{ gap: 12, flexDirection: "row" }}>
          <View style={{ flex: 1 }}>
            <Field label="Minutes">
              <Input value={minutes} onChangeText={setMinutes} inputMode="numeric" />
            </Field>
          </View>
          {hasDistance(kind) && (
            <View style={{ flex: 1 }}>
              <Field label="Distance (km)" hint="Optional">
                <Input value={km} onChangeText={setKm} inputMode="decimal" />
              </Field>
            </View>
          )}
        </View>
        {error && (
          <Text size={13} tone="coral">
            {error}
          </Text>
        )}
        <Text size={12.5} tone="muted">
          Saved in this browser only, marked as added by you.
        </Text>
      </View>
    </Sheet>
  );
}

function Workouts({ onLog }: { onLog: () => void }) {
  const list = useDB((d) => d.workouts);
  const shown = [...list].sort((a, b) => b.date.localeCompare(a.date));
  const week = list.filter((w) => daysFrom(w.date) > -7 && daysFrom(w.date) <= 0);

  return (
    <Section
      title="Workouts"
      meta={week.length ? `${week.length} ${week.length === 1 ? "workout" : "workouts"} this week` : undefined}
      action={<Button size="sm" variant="ghost" icon={<Plus size={16} />} onPress={onLog}>Log</Button>}
    >
      {shown.length ? (
        <List>
          {shown.map((w) => (
            <Row
              key={w.id}
              minHeight={52}
              onPress={() => {}}
              left={<Label style={{ width: 60 }}>{kindLabel[w.kind][0]}</Label>}
              right={
                <View style={{ alignItems: "flex-end" }}>
                  <Text size={13.5} num>
                    {w.minutes} min
                  </Text>
                  {w.km !== undefined && (
                    <Text size={12.5} tone="muted" num>
                      {w.km} km
                    </Text>
                  )}
                </View>
              }
            >
              <View>
                <Text size={14}>{w.title}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
                  <Text size={12.5} tone="muted">
                    {relDay(w.date)}, {time(w.date)}
                  </Text>
                  <Source id={w.source} />
                </View>
              </View>
              {w.source === "manual" && (
                <IconButton label={`Remove ${w.title}`} onPress={() => db.remove("workouts", w.id)}>
                  <Trash size={16} />
                </IconButton>
              )}
            </Row>
          ))}
        </List>
      ) : (
        <Empty title="No workouts yet" action={<Button onPress={onLog}>Log a workout</Button>}>
          Workouts from Strava and Apple Health appear here, along with any you add.
        </Empty>
      )}
    </Section>
  );
}

export function HealthSection() {
  const daily = useDB((d) => d.daily);
  const workouts = useDB((d) => d.workouts);
  const [logging, setLogging] = useState(false);
  const loading = useSimulatedLoad("health");
  const line = summary(daily, workouts);

  return (
    <Screen back>
      <Page eyebrow="Wellbeing" title="Health">
        {loading ? (
          <SkeletonList rows={8} />
        ) : (
          <View style={{ gap: 24 }}>
            <Text size={18} font="serif" style={{ fontStyle: "italic", marginBottom: 8 }}>
              {line}
            </Text>
            <Section title="Stats">
              <Metrics />
            </Section>
            <Workouts onLog={() => setLogging(true)} />
            <Text size={12.5} tone="muted" style={{ borderTopWidth: 1, borderTopColor: "#DDD7CD", paddingTop: 14 }}>
              Orbit summarises data from your connected apps. It isn't medical advice.
            </Text>
          </View>
        )}
      </Page>
      <LogSheet open={logging} onClose={() => setLogging(false)} />
    </Screen>
  );
}
