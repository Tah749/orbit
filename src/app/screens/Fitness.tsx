import { useState } from "react";
import { Footprints, Moon, Barbell, CheckCircle, Circle } from "@phosphor-icons/react";
import { useStore } from "../store";
import { fitness } from "../data";
import { Card, CardHead, PageHeader, Segmented } from "../ui";

const views = ["Activity", "Workouts", "Sleep"] as const;
type View = (typeof views)[number];
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function Bars({ values, max, unit, highlight }: { values: number[]; max: number; unit: string; highlight: number }) {
  return (
    <div className="flex h-44 items-end gap-2 sm:gap-3" role="img" aria-label={values.map((v, i) => `${days[i]} ${v}${unit}`).join(", ")}>
      {values.map((v, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
          <span className="font-mono text-[10.5px] text-muted">{v || ""}</span>
          <div className={`w-full rounded-t-md ${i === highlight ? "bg-accent" : "bg-[#3a2233]"}`} style={{ height: `${Math.max((v / max) * 128, 3)}px` }} />
          <span className="text-[11px] text-muted">{days[i]}</span>
        </div>
      ))}
    </div>
  );
}

export function FitnessScreen() {
  const { toast } = useStore();
  const [view, setView] = useState<View>("Activity");
  const [workouts, setWorkouts] = useState(fitness.workouts);
  const r = 42, circ = 2 * Math.PI * r;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Fitness" subtitle="Your activity and routines, alongside the rest of your day." />
      <Segmented items={views} value={view} onChange={setView} label="Fitness views" className="w-full sm:w-auto" />

      {view === "Activity" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[auto_minmax(0,1fr)]">
          <Card className="flex items-center gap-6 p-5">
            <div className="relative size-32">
              <svg viewBox="0 0 100 100" className="size-32 -rotate-90" aria-hidden="true">
                <circle cx="50" cy="50" r={r} fill="none" stroke="var(--soft)" strokeWidth="9" />
                <circle cx="50" cy="50" r={r} fill="none" stroke="var(--green)" strokeWidth="9" strokeLinecap="round" strokeDasharray={`${(fitness.steps / fitness.goal) * circ} ${circ}`} />
              </svg>
              <div className="absolute inset-0 grid place-items-center text-center">
                <div><p className="font-mono text-[22px] leading-none">8,432</p><p className="text-[11px] text-muted">of 10,000 steps</p></div>
              </div>
            </div>
            <ul className="flex flex-col gap-3 text-[13px]">
              <li className="flex items-center gap-2"><Footprints size={16} className="text-accent" /> {fitness.distanceKm} km today</li>
              <li className="flex items-center gap-2"><Moon size={16} className="text-info" /> 7h 12m sleep</li>
              <li className="flex items-center gap-2"><Barbell size={16} className="text-warn" /> {workouts.filter((w) => w.done).length} of {workouts.length} workouts</li>
            </ul>
          </Card>
          <Card className="flex flex-col gap-3 p-5">
            <CardHead title="Active minutes this week" />
            <Bars values={fitness.activeMin} max={80} unit=" min" highlight={1} />
          </Card>
        </div>
      )}

      {view === "Workouts" && (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-line">
            {workouts.map((w, i) => (
              <li key={w.title}>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={w.done}
                  onClick={() => {
                    setWorkouts((ws) => ws.map((x, j) => (j === i ? { ...x, done: !x.done } : x)));
                    if (!w.done) toast("Nice work. Logged.");
                  }}
                  className="flex w-full items-center gap-3 px-5 py-3.5 text-left hover:bg-soft/60"
                >
                  {w.done ? <CheckCircle size={20} weight="fill" className="text-accent" /> : <Circle size={20} className="text-[#5a5368]" />}
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-[13.5px] ${w.done ? "text-muted line-through" : ""}`}>{w.title}</p>
                    <p className="text-[12px] text-muted">{w.when} · {w.len}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {view === "Sleep" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <Card className="flex flex-col gap-3 p-5">
            <CardHead title="Hours asleep" />
            <Bars values={fitness.sleep.map((s) => s.h)} max={9} unit="h" highlight={6} />
          </Card>
          <Card className="flex flex-col gap-3 p-5">
            <CardHead title="Goals" />
            {[["Walk 10k steps a day", "4 of 7 days"], ["Asleep by 23:00", "5 of 7 nights"], ["Three workouts a week", "1 of 3"]].map(([g, p]) => (
              <div key={g} className="flex items-center justify-between gap-2 text-[13px]">
                <span>{g}</span><span className="shrink-0 text-muted">{p}</span>
              </div>
            ))}
          </Card>
        </div>
      )}
      <p className="text-[12px] text-muted">Sample data. Orbit shows your activity; it doesn't give medical advice.</p>
    </div>
  );
}
