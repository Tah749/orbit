import { at, on } from "../time";
import type { SourceId } from "./sources";

/* People, documents and renewals, health. */

export type Contact = {
  id: string;
  name: string;
  relation: "family" | "partner" | "friend" | "work" | "home";
  email?: string;
  phone?: string;
  /** MM-DD */
  birthday?: string;
  notes?: string;
  lastContact?: string;
  source: SourceId;
};

const mmdd = (days: number) => on(days).slice(5);

export const contacts: Contact[] = [
  { id: "ct-sam", name: "Sam Rowe", relation: "partner", email: "sam@rowe.example", phone: "07700 900114", birthday: mmdd(64), source: "icloud", lastContact: at(0, "07:40") },
  { id: "ct-mum", name: "Jan Rowe (Mum)", relation: "family", email: "jan.rowe@example.com", phone: "07700 900221", birthday: mmdd(9), notes: "Would like a new garden book.", source: "icloud", lastContact: at(-1, "20:31") },
  { id: "ct-dad", name: "Pete Rowe (Dad)", relation: "family", phone: "07700 900222", birthday: mmdd(143), source: "icloud", lastContact: at(-12, "18:00") },
  { id: "ct-priya", name: "Priya Shah", relation: "work", email: "priya@lumen.example", source: "gmail", lastContact: at(0, "08:42") },
  { id: "ct-marcus", name: "Marcus Webb", relation: "work", email: "marcus@lumen.example", source: "outlook", lastContact: at(-1, "16:40") },
  { id: "ct-tomas", name: "Tomás Ruiz", relation: "friend", phone: "07700 900345", birthday: mmdd(21), source: "icloud", lastContact: at(-9, "21:00") },
  { id: "ct-dan", name: "Dan Okafor", relation: "friend", email: "dan@okafor.example", birthday: mmdd(-3), source: "gmail", lastContact: at(0, "11:15") },
  { id: "ct-ella", name: "Ella Byrne", relation: "friend", phone: "07700 900456", birthday: mmdd(33), notes: "Moved to Bristol in the summer.", source: "icloud", lastContact: at(-47, "19:00") },
  { id: "ct-tom", name: "Tom Hughes", relation: "home", email: "tom.hughes@example.com", notes: "Landlord.", source: "gmail", lastContact: at(-2, "09:20") },
];

export type DocKind = "passport" | "licence" | "insurance" | "mot" | "tax" | "tv-licence" | "warranty" | "tenancy" | "health" | "other";

export type Doc = {
  id: string;
  title: string;
  kind: DocKind;
  /** YYYY-MM-DD when it expires or renews. */
  expires?: string;
  reference?: string;
  holder?: string;
  notes?: string;
  /** Registration, for documents that belong to a car. */
  vehicle?: string;
  source: SourceId;
};

export const docs: Doc[] = [
  { id: "doc-car-insurance", title: "Car insurance", kind: "insurance", expires: on(10), reference: "HB-2291-0045", notes: "Renewal quote £486.20 (last year £431.50).", vehicle: "LK19 XRT", holder: "Alex Rowe", source: "outlook" },
  { id: "doc-mot", title: "MOT · VW Golf (LK19 XRT)", kind: "mot", expires: on(47), reference: "LK19 XRT", vehicle: "LK19 XRT", source: "dvla" },
  { id: "doc-vehicle-tax", title: "Vehicle tax · LK19 XRT", kind: "tax", expires: on(78), vehicle: "LK19 XRT", notes: "Paid yearly by Direct Debit.", source: "dvla" },
  { id: "doc-passport", title: "Passport", kind: "passport", expires: on(212), holder: "Alex Rowe", reference: "Ends 4471", notes: "Some countries need 6 months left.", source: "manual" },
  { id: "doc-passport-sam", title: "Passport (Sam)", kind: "passport", expires: on(590), holder: "Sam Rowe", source: "manual" },
  { id: "doc-licence", title: "Driving licence photocard", kind: "licence", expires: on(1120), source: "manual" },
  { id: "doc-tv", title: "TV Licence", kind: "tv-licence", expires: on(131), reference: "TVL 4401 2287", source: "gmail" },
  { id: "doc-tenancy", title: "Tenancy agreement", kind: "tenancy", expires: on(164), notes: "Two months' notice to leave or renew.", source: "manual" },
  { id: "doc-contents", title: "Contents insurance", kind: "insurance", expires: on(96), reference: "CT-88120", source: "gmail" },
  { id: "doc-laptop", title: "Laptop warranty", kind: "warranty", expires: on(58), reference: "Serial C02XK1", source: "gmail" },
  { id: "doc-ehic", title: "GHIC card", kind: "health", expires: on(740), source: "manual" },
];

export type Workout = {
  id: string;
  date: string;
  kind: "run" | "ride" | "walk" | "swim" | "strength" | "yoga";
  title: string;
  minutes: number;
  km?: number;
  source: SourceId;
};

export const workouts: Workout[] = [
  { id: "wo-1", date: at(-1, "07:00"), kind: "yoga", title: "Vinyasa", minutes: 60, source: "apple-health" },
  { id: "wo-2", date: at(-2, "18:30"), kind: "run", title: "Evening run, Regent's Canal", minutes: 34, km: 6.2, source: "strava" },
  { id: "wo-3", date: at(-4, "18:15"), kind: "strength", title: "Upper body", minutes: 55, source: "apple-health" },
  { id: "wo-4", date: at(-5, "08:00"), kind: "ride", title: "Commute", minutes: 26, km: 8.4, source: "strava" },
  { id: "wo-5", date: at(-6, "09:10"), kind: "run", title: "Parkrun, Highbury Fields", minutes: 25, km: 5, source: "strava" },
  { id: "wo-6", date: at(-8, "18:15"), kind: "strength", title: "Legs", minutes: 50, source: "apple-health" },
  { id: "wo-7", date: at(-9, "07:30"), kind: "swim", title: "Pool, 40 lengths", minutes: 38, km: 1, source: "apple-health" },
];

export type DayStats = { date: string; steps: number; sleepMin: number; restingHr: number; activeMin: number };

/** Last 14 days, oldest first. */
export const daily: DayStats[] = Array.from({ length: 14 }, (_, i) => {
  const d = i - 13;
  const wave = Math.sin(i * 1.3);
  return {
    date: on(d),
    steps: Math.round(8200 + wave * 2600 + (i % 3) * 700),
    sleepMin: Math.round(430 + Math.cos(i * 0.9) * 40),
    restingHr: Math.round(57 + Math.sin(i * 0.7) * 3),
    activeMin: Math.round(38 + wave * 18),
  };
});
