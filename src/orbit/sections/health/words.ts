import type { DayStats, Workout } from "../../data/life";
import { daysFrom } from "../../time";

/* Plain-language comparisons for the health page. Factual only: no targets, scores or advice. */

export const avg = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0);

/** This week (the last 7 days, today included) and the 7 days before. */
export function weeks(daily: DayStats[]) {
  const sorted = [...daily].sort((a, b) => a.date.localeCompare(b.date));
  return { now: sorted.filter((d) => daysFrom(d.date) > -7), before: sorted.filter((d) => daysFrom(d.date) <= -7 && daysFrom(d.date) > -14), all: sorted.slice(-14) };
}

export const hm = (min: number) => {
  const m = Math.round(min);
  const h = Math.floor(m / 60);
  return h ? `${h}h ${String(m % 60).padStart(2, "0")}m` : `${m}m`;
};

export const times = (n: number) => (n === 1 ? "once" : n === 2 ? "twice" : `${words[n] ?? n} times`);
const words = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
export const count = (n: number, one: string, many = `${one}s`) => `${words[n] ?? n} ${n === 1 ? one : many}`;

/** "About 600 more a day than last week." */
export function compare(now: number, before: number, o: { unit: (n: number) => string; per: string; same: number; more?: string; less?: string }) {
  if (!before) return "Nothing from last week to compare with.";
  const diff = now - before;
  if (Math.abs(diff) < o.same) return "About the same as last week.";
  return `${o.unit(Math.abs(diff))} ${diff > 0 ? (o.more ?? "more") : (o.less ?? "less")} ${o.per} than last week.`;
}

export const kindLabel: Record<Workout["kind"], [string, string]> = {
  run: ["Run", "Runs"],
  ride: ["Ride", "Rides"],
  walk: ["Walk", "Walks"],
  swim: ["Swim", "Swims"],
  strength: ["Strength", "Strength"],
  yoga: ["Yoga", "Yoga"],
};

/** One calm line about the week, e.g. "You slept a little more this week and ran twice." */
export function summary(daily: DayStats[], workouts: Workout[]) {
  const { now, before } = weeks(daily);
  const week = workouts.filter((w) => daysFrom(w.date) > -7 && daysFrom(w.date) <= 0);
  const runs = week.filter((w) => w.kind === "run").length;
  const others = week.length - runs;

  let did: string;
  if (runs && others) did = `ran ${times(runs)}, plus ${count(others, "other workout")}`;
  else if (runs) did = `ran ${times(runs)}`;
  else if (others) did = `fitted in ${count(others, "workout")}`;
  else did = "didn't log a workout";

  const sleep = before.length ? avg(now.map((d) => d.sleepMin)) - avg(before.map((d) => d.sleepMin)) : 0;
  let line: string;
  if (sleep >= 30) line = `You slept more this week and ${did}.`;
  else if (sleep >= 10) line = `You slept a little more this week and ${did}.`;
  else if (sleep <= -30) line = `You slept less this week and ${did}.`;
  else if (sleep <= -10) line = `You slept a little less this week and ${did}.`;
  else line = `Your sleep was steady this week, and you ${did}.`;

  const steps = before.length ? avg(now.map((d) => d.steps)) - avg(before.map((d) => d.steps)) : 0;
  if (steps >= 500) line += " Steps were up on last week.";
  else if (steps <= -500) line += " Steps were down a little on last week.";
  return line;
}
