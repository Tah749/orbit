import { at, nextSunday } from "../time";
import type { Ref, SourceId } from "./sources";

export type CalendarId = "personal" | "work" | "family" | "travel";

export const calendars: { id: CalendarId; name: string; source: SourceId }[] = [
  { id: "personal", name: "Personal", source: "google-calendar" },
  { id: "work", name: "Work", source: "outlook-calendar" },
  { id: "family", name: "Family", source: "icloud" },
  { id: "travel", name: "Travel", source: "orbit" },
];

export type CalEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay?: boolean;
  location?: string;
  calendar: CalendarId;
  attendees?: string[];
  notes?: string;
  video?: string;
  links?: Ref[];
  source: SourceId;
};

export const events: CalEvent[] = [
  { id: "ev-standup", title: "Team stand-up", start: at(0, "09:30"), end: at(0, "09:45"), calendar: "work", video: "Meet", attendees: ["Priya Shah", "Marcus Webb", "Lena Fischer"], source: "outlook-calendar" },
  { id: "ev-lunch", title: "Lunch with Tomás", start: at(0, "12:30"), end: at(0, "13:30"), calendar: "personal", location: "Dishoom, Carnaby", source: "google-calendar" },
  { id: "ev-review", title: "Q3 project review", start: at(0, "15:00"), end: at(0, "16:00"), calendar: "work", location: "Room 4", attendees: ["Priya Shah", "Marcus Webb"], notes: "Moved from 11:00.", source: "outlook-calendar" },
  { id: "ev-gym", title: "Strength session", start: at(0, "18:15"), end: at(0, "19:15"), calendar: "personal", location: "Third Space, Soho", source: "google-calendar" },
  { id: "ev-1to1", title: "1:1 with Marcus", start: at(1, "10:00"), end: at(1, "10:30"), calendar: "work", video: "Teams", source: "outlook-calendar" },
  {
    id: "ev-flight",
    title: "Flight BZ 1452 to Edinburgh",
    start: at(1, "16:20"),
    end: at(1, "17:45"),
    calendar: "travel",
    location: "Heathrow T5",
    links: [{ kind: "booking", id: "bk-flight-out" }],
    source: "orbit",
  },
  { id: "ev-kitchin", title: "Dinner at The Kitchin", start: at(2, "19:30"), end: at(2, "21:30"), calendar: "travel", location: "Leith, Edinburgh", links: [{ kind: "booking", id: "bk-dinner" }], source: "orbit" },
  { id: "ev-flight-back", title: "Flight BZ 1459 to London", start: at(3, "18:05"), end: at(3, "19:30"), calendar: "travel", location: "Edinburgh Airport", links: [{ kind: "booking", id: "bk-flight-back" }], source: "orbit" },
  { id: "ev-5aside", title: "5-a-side", start: at(2, "19:00"), end: at(2, "20:00"), calendar: "personal", location: "Market Road", source: "google-calendar" },
  { id: "ev-lunch-mum", title: "Sunday lunch at Mum and Dad's", start: at(nextSunday(), "13:00"), end: at(nextSunday(), "16:00"), calendar: "family", location: "St Albans", source: "icloud" },
  { id: "ev-dentist", title: "Dentist check-up", start: at(8, "08:30"), end: at(8, "09:00"), calendar: "personal", location: "Bright Smile, Angel", source: "google-calendar" },
  { id: "ev-planning", title: "Roadmap planning", start: at(7, "13:00"), end: at(7, "15:00"), calendar: "work", location: "Room 2", source: "outlook-calendar" },
  { id: "ev-mum-bday", title: "Mum's birthday", start: at(9, "00:00"), end: at(10, "00:00"), allDay: true, calendar: "family", links: [{ kind: "contact", id: "ct-mum" }], source: "icloud" },
  { id: "ev-yoga", title: "Yoga", start: at(-1, "07:00"), end: at(-1, "08:00"), calendar: "personal", location: "Triyoga, Camden", source: "google-calendar" },
  { id: "ev-design", title: "Design crit", start: at(-1, "14:00"), end: at(-1, "15:00"), calendar: "work", source: "outlook-calendar" },
  { id: "ev-dan-call", title: "Call with Dan", start: at(0, "15:30"), end: at(0, "16:00"), calendar: "personal", notes: "About the stag weekend dates.", links: [{ kind: "contact", id: "ct-dan" }], source: "google-calendar" },
  { id: "ev-edinburgh", title: "Edinburgh", start: at(1, "00:00"), end: at(4, "00:00"), allDay: true, calendar: "travel", location: "Hotel Calder", links: [{ kind: "booking", id: "bk-hotel" }], source: "orbit" },
  { id: "ev-olmo", title: "Dinner at Olmo", start: at(4, "19:30"), end: at(4, "21:30"), calendar: "personal", location: "Olmo, Marylebone", attendees: ["Sam Rowe"], links: [{ kind: "booking", id: "bk-olmo" }], source: "orbit" },
  { id: "ev-focus", title: "Focus time: board deck", start: at(4, "09:30"), end: at(4, "12:00"), calendar: "work", source: "outlook-calendar" },
  { id: "ev-allhands", title: "Company all-hands", start: at(4, "11:00"), end: at(4, "12:00"), calendar: "work", video: "Teams", source: "outlook-calendar" },
  { id: "ev-swim", title: "Swim", start: at(6, "08:00"), end: at(6, "09:00"), calendar: "personal", location: "Oasis, Holborn", source: "google-calendar" },
  { id: "ev-gig", title: "Nils Frahm at the Barbican", start: at(12, "19:30"), end: at(12, "22:00"), calendar: "personal", attendees: ["Sam Rowe"], links: [{ kind: "booking", id: "bk-gig" }], source: "orbit" },
  { id: "ev-cinema", title: "Cinema with Sam", start: at(-3, "19:45"), end: at(-3, "22:10"), calendar: "personal", location: "Curzon, Bloomsbury", source: "google-calendar" },
  { id: "ev-bins", title: "Recycling collection", start: at(3, "00:00"), end: at(4, "00:00"), allDay: true, calendar: "family", source: "icloud" },
];
