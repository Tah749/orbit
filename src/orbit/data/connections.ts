import { at } from "../time";
import type { SourceId } from "./sources";

export type Connection = {
  id: SourceId;
  category: "Email" | "Calendars" | "Banking" | "Investments" | "Business" | "Health" | "Tasks" | "Deliveries" | "Car";
  /** In this sample app, "connected" only means sample data is shown for it. */
  status: "connected" | "available" | "coming-soon";
  lastSync?: string;
  detail: string;
};

export const connections: Connection[] = [
  { id: "gmail", category: "Email", status: "connected", lastSync: at(0, "08:58"), detail: "alex@rowe.example" },
  { id: "outlook", category: "Email", status: "connected", lastSync: at(0, "08:57"), detail: "Work account" },
  { id: "google-calendar", category: "Calendars", status: "connected", lastSync: at(0, "08:58"), detail: "Personal" },
  { id: "outlook-calendar", category: "Calendars", status: "connected", lastSync: at(0, "08:57"), detail: "Work" },
  { id: "icloud", category: "Calendars", status: "connected", lastSync: at(0, "08:40"), detail: "Family calendar and contacts" },
  { id: "monzo", category: "Banking", status: "connected", lastSync: at(0, "08:55"), detail: "Current account and pots" },
  { id: "starling", category: "Banking", status: "connected", lastSync: at(0, "08:40"), detail: "Business account" },
  { id: "amex", category: "Banking", status: "connected", lastSync: at(0, "06:12"), detail: "Amex Gold" },
  { id: "trading212", category: "Investments", status: "connected", lastSync: at(0, "07:00"), detail: "Stocks ISA and Invest" },
  { id: "vanguard", category: "Investments", status: "connected", lastSync: at(-1, "22:00"), detail: "Personal pension" },
  { id: "shopify", category: "Business", status: "connected", lastSync: at(0, "08:52"), detail: "Fern & Thread" },
  { id: "etsy", category: "Business", status: "connected", lastSync: at(0, "08:30"), detail: "FernAndThreadUK" },
  { id: "stripe", category: "Business", status: "available", detail: "Payments and payouts" },
  { id: "strava", category: "Health", status: "connected", lastSync: at(-1, "19:10"), detail: "Runs and rides" },
  { id: "apple-health", category: "Health", status: "connected", lastSync: at(0, "07:30"), detail: "Steps, sleep and workouts" },
  { id: "todoist", category: "Tasks", status: "available", detail: "Two-way task sync" },
  { id: "royal-mail", category: "Deliveries", status: "connected", lastSync: at(0, "06:58"), detail: "Parcel tracking" },
  { id: "dvla", category: "Car", status: "connected", lastSync: at(-2, "09:00"), detail: "LK19 XRT" },
];

export type Settings = {
  name: string;
  briefingTime: string;
  weekStartsMonday: boolean;
  quietFrom: string;
  quietTo: string;
  digest: "morning" | "morning-evening" | "off";
  showBusinessInToday: boolean;
};

export const settings: Settings = {
  name: "Alex",
  briefingTime: "07:30",
  weekStartsMonday: true,
  quietFrom: "22:00",
  quietTo: "07:00",
  digest: "morning",
  showBusinessInToday: true,
};
