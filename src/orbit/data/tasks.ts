import { at, on } from "../time";
import type { Ref, SourceId } from "./sources";

export type TaskList = "personal" | "work" | "home" | "shop";

export const taskLists: { id: TaskList; name: string }[] = [
  { id: "personal", name: "Personal" },
  { id: "work", name: "Work" },
  { id: "home", name: "Home" },
  { id: "shop", name: "Fern & Thread" },
];

export type Task = {
  id: string;
  title: string;
  notes?: string;
  /** YYYY-MM-DD */
  due?: string;
  done: boolean;
  doneAt?: string;
  list: TaskList;
  priority?: boolean;
  /** Where Orbit found it. */
  from?: Ref;
  source: SourceId;
  createdAt: string;
};

export const tasks: Task[] = [
  { id: "tk-numbers", title: "Send Q3 numbers to Priya", due: on(2), done: false, list: "work", priority: true, from: { kind: "message", id: "msg-priya" }, source: "orbit", createdAt: at(0, "08:43") },
  { id: "tk-checkin", title: "Check in for BZ 1452", due: on(1), done: false, list: "personal", priority: true, from: { kind: "booking", id: "bk-flight-out" }, source: "orbit", createdAt: at(0, "07:06") },
  { id: "tk-insurance", title: "Compare car insurance quotes", notes: "Renewal is £486.20, up from £431.50.", due: on(6), done: false, list: "personal", from: { kind: "doc", id: "doc-car-insurance" }, source: "orbit", createdAt: at(-3, "08:01") },
  { id: "tk-mum", title: "Reply to Mum about Sunday", due: on(3), done: false, list: "personal", from: { kind: "message", id: "msg-mum" }, source: "orbit", createdAt: at(-1, "20:32") },
  { id: "tk-boiler", title: "Pick a day for the boiler service", due: on(1), done: false, list: "home", from: { kind: "message", id: "msg-landlord" }, source: "orbit", createdAt: at(-2, "09:21") },
  { id: "tk-pack", title: "Pack for Edinburgh", due: on(0), done: false, list: "personal", source: "manual", createdAt: at(-2, "19:00") },
  { id: "tk-roadmap", title: "Draft the roadmap", due: on(7), done: false, list: "work", from: { kind: "message", id: "msg-lumen-standup" }, source: "orbit", createdAt: at(-1, "16:41") },
  { id: "tk-pricing", title: "Pricing page copy", done: false, list: "work", from: { kind: "message", id: "msg-lumen-standup" }, source: "orbit", createdAt: at(-1, "16:41") },
  { id: "tk-restock", title: "Restock Juniper candles", notes: "3 left in stock.", due: on(4), done: false, list: "shop", source: "orbit", createdAt: at(-1, "09:00") },
  { id: "tk-photos", title: "Photograph the new print range", done: false, list: "shop", source: "manual", createdAt: at(-4, "21:10") },
  { id: "tk-gift", title: "Buy Mum's birthday present", notes: "She mentioned a garden book.", due: on(7), done: false, list: "personal", from: { kind: "contact", id: "ct-mum" }, source: "orbit", createdAt: at(-2, "10:00") },
  { id: "tk-library", title: "Return library books", due: on(-1), done: false, list: "personal", source: "manual", createdAt: at(-9, "12:00") },
  { id: "tk-table", title: "Book table for Saturday", done: true, doneAt: at(-1, "13:05"), list: "personal", source: "manual", createdAt: at(-3, "13:00") },
  { id: "tk-deck", title: "Share deck with Lena", done: true, doneAt: at(-1, "11:20"), list: "work", source: "manual", createdAt: at(-2, "15:00") },
];
