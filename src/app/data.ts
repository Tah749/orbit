/**
 * Sample data for the interactive Orbit demo. Everything here is fictional.
 * "Today" in the demo is Tuesday 14 October.
 */

export type TabKey =
  | "home"
  | "inbox"
  | "calendar"
  | "email"
  | "bills"
  | "investments"
  | "bookings"
  | "fitness"
  | "tasks"
  | "assistant"
  | "settings";

export type Task = { id: number; title: string; due: string; group: "today" | "upcoming"; source: string; priority?: boolean; done: boolean };

export const initialTasks: Task[] = [
  { id: 1, title: "Send launch numbers to Priya", due: "Today, 12:00", group: "today", source: "From email", priority: true, done: false },
  { id: 2, title: "Renew car insurance", due: "Fri 17 Oct", group: "today", source: "Policy ends 24 Oct", priority: true, done: false },
  { id: 3, title: "Pack for Edinburgh", due: "Today, 21:00", group: "today", source: "Travel", done: false },
  { id: 4, title: "Plan weekend trip to the Peak District", due: "Sat 18 Oct", group: "upcoming", source: "Personal", done: false },
  { id: 5, title: "Book dentist check-up", due: "Next week", group: "upcoming", source: "Personal", done: false },
  { id: 6, title: "Return library books", due: "Mon 20 Oct", group: "upcoming", source: "Personal", done: false },
  { id: 7, title: "Book table for Saturday", due: "Done yesterday", group: "today", source: "Bookings", done: true },
];

export type InboxItem = {
  id: number;
  kind: "Travel" | "Bills" | "Personal" | "Work";
  important: boolean;
  title: string;
  preview: string;
  source: string;
  date: string;
  badge?: { label: string; tone: "coral" | "amber" | "rose" | "violet" };
  detail: string[];
  action: { label: string; tab: TabKey };
};

export const inboxItems: InboxItem[] = [
  {
    id: 1, kind: "Travel", important: true, title: "Flight to Edinburgh tomorrow",
    preview: "BZ 1452 · 16:20 · Terminal 5. Online check-in is open.", source: "Brisa Air via Email", date: "Today",
    badge: { label: "High", tone: "coral" },
    detail: ["Departs Heathrow T5 at 16:20, arrives Edinburgh 17:45.", "Booking reference K7QX2M.", "Online check-in closes 1 hour before departure."],
    action: { label: "Open booking", tab: "bookings" },
  },
  {
    id: 2, kind: "Bills", important: true, title: "Electricity bill due in 3 days",
    preview: "£68.32 from Northgrid Energy, due 17 Oct.", source: "Bills", date: "Today",
    badge: { label: "Due soon", tone: "amber" },
    detail: ["October bill: £68.32.", "Due Friday 17 October.", "That's £4.10 more than September."],
    action: { label: "View bills", tab: "bills" },
  },
  {
    id: 3, kind: "Work", important: true, title: "Priya is waiting for a reply",
    preview: "\"Could you send the final numbers before Thursday?\"", source: "Email", date: "08:42",
    badge: { label: "Reply", tone: "rose" },
    detail: ["Priya needs Q3 revenue and retention figures.", "Deadline: before Thursday's board prep.", "The launch deck is attached."],
    action: { label: "Open email", tab: "email" },
  },
  {
    id: 4, kind: "Personal", important: false, title: "Table for two confirmed",
    preview: "Saturday 19:30 at Olmo, Marylebone. Ref OL-2281.", source: "Bookings", date: "Yest",
    detail: ["Saturday 18 October at 19:30.", "Olmo, 14 Blandford Street, Marylebone.", "Reference OL-2281."],
    action: { label: "Open bookings", tab: "bookings" },
  },
  {
    id: 5, kind: "Bills", important: false, title: "Cloud storage renews Monday",
    preview: "£7.99 monthly plan renews on 20 Oct.", source: "Subscriptions", date: "Mon",
    detail: ["2 TB plan, £7.99 a month.", "Renews Monday 20 October.", "You've used 31% of your storage."],
    action: { label: "View subscriptions", tab: "bills" },
  },
  {
    id: 6, kind: "Personal", important: false, title: "Mum's birthday is next Wednesday",
    preview: "You noted last year that she'd like a new garden book.", source: "Calendar", date: "Sun",
    detail: ["Wednesday 22 October.", "Last year you sent flowers on the day.", "Want a reminder on Sunday to post a card?"],
    action: { label: "Add a task", tab: "tasks" },
  },
];

export type Mail = {
  id: number;
  from: string;
  email: string;
  subject: string;
  time: string;
  folder: "Important" | "Travel" | "Bills" | "Other";
  unread: boolean;
  body: string;
  summary: string[];
  suggestedReply?: string;
  attachment?: string;
};

export const mails: Mail[] = [
  {
    id: 1, from: "Priya Raman", email: "priya@lumenlabs.example", subject: "Re: Launch deck, final numbers", time: "08:42", folder: "Important", unread: true,
    body: "Hi Alex,\n\nThanks for the draft. Could you send the final Q3 revenue and retention numbers before Thursday? The board prep is Thursday afternoon and I'd like to slot them into slides 6 and 7.\n\nDeck attached with my comments.\n\nThanks,\nPriya",
    summary: ["Needs Q3 revenue and retention figures", "Deadline: before Thursday's board prep", "Deck attached for your comments"],
    suggestedReply: "Hi Priya,\n\nThanks for the comments. I'll send the final Q3 revenue and retention figures by Wednesday evening so you have them before board prep.\n\nBest,\nAlex",
    attachment: "launch-deck-v6.pdf",
  },
  {
    id: 2, from: "Harbour Lettings", email: "tenancies@harbour.example", subject: "Tenancy renewal documents", time: "07:15", folder: "Important", unread: true,
    body: "Dear Alex,\n\nYour tenancy renewal documents are ready to sign. Please review and sign by 31 October. The new term starts 1 December with no change to the monthly rent.\n\nKind regards,\nHarbour Lettings",
    summary: ["Renewal documents ready to sign", "Sign by 31 October", "Rent unchanged for the new term"],
    suggestedReply: "Hello,\n\nThanks for sending these over. I'll review and sign the documents this week.\n\nBest regards,\nAlex",
  },
  {
    id: 3, from: "Brisa Air", email: "bookings@brisa-air.example", subject: "Booking confirmed: London to Edinburgh", time: "Yest", folder: "Travel", unread: false,
    body: "Your booking is confirmed.\n\nBZ 1452, London Heathrow (T5) to Edinburgh\nWednesday 15 October, 16:20 to 17:45\nBooking reference: K7QX2M\n\nOnline check-in opens 24 hours before departure.",
    summary: ["Flight BZ 1452 on Wed 15 Oct, 16:20", "Booking reference K7QX2M", "Check-in opens 24 hours before"],
  },
  {
    id: 4, from: "Northgrid Energy", email: "billing@northgrid.example", subject: "Your October bill is ready", time: "Mon", folder: "Bills", unread: false,
    body: "Your October electricity bill is ready.\n\nAmount due: £68.32\nDue date: 17 October\n\nPay by direct debit or through your online account.",
    summary: ["£68.32 due 17 October", "£4.10 more than September"],
  },
  {
    id: 5, from: "Hotel Calder", email: "stay@hotelcalder.example", subject: "Your reservation, 15 to 17 Oct", time: "Sun", folder: "Travel", unread: false,
    body: "Dear Alex,\n\nWe look forward to welcoming you.\n\nCheck-in: Wednesday 15 October from 15:00\nCheck-out: Friday 17 October by 11:00\nReference: HC-48213\nBreakfast included.",
    summary: ["Two nights from 15 October", "Check-in from 15:00", "Reference HC-48213, breakfast included"],
  },
  {
    id: 6, from: "Fernhill Books", email: "orders@fernhill.example", subject: "Receipt for your order #40172", time: "Sat", folder: "Other", unread: false,
    body: "Thanks for your order.\n\nThe Well-Gardened Mind, £12.99\nDelivery: Tuesday 21 October",
    summary: ["£12.99 paid", "Arrives Tuesday 21 October"],
  },
];

export type Bill = { name: string; company: string; amount: number; due: string; inDays: number; kind: "bill" | "subscription"; paid?: boolean };

export const bills: Bill[] = [
  { name: "Electricity", company: "Northgrid Energy", amount: 68.32, due: "Fri 17 Oct", inDays: 3, kind: "bill" },
  { name: "Broadband", company: "Lumen Fibre", amount: 29.99, due: "Sat 18 Oct", inDays: 4, kind: "bill" },
  { name: "Cloud storage", company: "Subscription", amount: 7.99, due: "Mon 20 Oct", inDays: 6, kind: "subscription" },
  { name: "Music streaming", company: "Subscription", amount: 10.99, due: "Fri 24 Oct", inDays: 10, kind: "subscription" },
  { name: "Council tax", company: "Borough council", amount: 142.0, due: "Sat 1 Nov", inDays: 18, kind: "bill" },
  { name: "Gym membership", company: "Subscription", amount: 34.5, due: "Thu 6 Nov", inDays: 23, kind: "subscription" },
  { name: "Water", company: "Thames Valley Water", amount: 38.4, due: "Paid 2 Oct", inDays: -12, kind: "bill", paid: true },
  { name: "Phone", company: "Kestrel Mobile", amount: 18.0, due: "Paid 28 Sep", inDays: -16, kind: "bill", paid: true },
];

export const portfolio = {
  value: 24832.17,
  ranges: {
    "1D": { change: 196.4, pct: 0.8, series: [24.63, 24.65, 24.6, 24.68, 24.7, 24.66, 24.72, 24.75, 24.74, 24.79, 24.81, 24.832] },
    "1M": { change: 612.9, pct: 2.53, series: [24.2, 24.1, 24.3, 24.25, 24.4, 24.35, 24.5, 24.45, 24.6, 24.55, 24.7, 24.832] },
    "1Y": { change: 2104.55, pct: 9.26, series: [22.7, 22.9, 23.1, 22.8, 23.4, 23.2, 23.6, 23.5, 23.9, 23.7, 24.1, 24.0, 24.3, 24.1, 24.5, 24.832] },
    ALL: { change: 6832.17, pct: 37.96, series: [18, 18.6, 19.2, 18.9, 20.1, 20.8, 21.4, 20.9, 22.2, 23.1, 23.8, 24.832] },
  },
  allocation: [
    { k: "Global equities", v: 52, c: "var(--green)" },
    { k: "UK equities", v: 21, c: "var(--blue)" },
    { k: "Bonds", v: 15, c: "var(--sageDeep)" },
    { k: "Cash", v: 12, c: "#5a5368" },
  ],
  holdings: [
    { name: "Global Index Fund", account: "Stocks & Shares ISA", value: 12910.44, day: 0.9 },
    { name: "UK All-Share Tracker", account: "Stocks & Shares ISA", value: 5214.73, day: 0.4 },
    { name: "Short Gilt Fund", account: "General account", value: 3725.12, day: 0.1 },
    { name: "Cash", account: "General account", value: 2981.88, day: 0 },
  ],
};

export type Booking = {
  id: string;
  kind: "flight" | "hotel" | "dinner" | "train";
  title: string;
  when: string;
  where: string;
  ref: string;
  note?: string;
  status: "upcoming" | "past" | "saved";
};

export const bookings: Booking[] = [
  { id: "b1", kind: "flight", title: "Flight BZ 1452, LHR to EDI", when: "Wed 15 Oct · 16:20 to 17:45", where: "Heathrow Terminal 5", ref: "K7QX2M", note: "Check-in is open", status: "upcoming" },
  { id: "b2", kind: "hotel", title: "Hotel Calder, 2 nights", when: "Wed 15 to Fri 17 Oct", where: "Old Town, Edinburgh", ref: "HC-48213", note: "Check-in from 15:00", status: "upcoming" },
  { id: "b3", kind: "dinner", title: "Dinner at The Kitchin", when: "Thu 16 Oct · 19:30", where: "Leith, Edinburgh", ref: "TK-9031", note: "Table for 2", status: "upcoming" },
  { id: "b4", kind: "train", title: "Train, EDI to King's Cross", when: "Fri 17 Oct · 13:00", where: "Edinburgh Waverley", ref: "7XR4-LN", note: "Coach C, seat 14", status: "upcoming" },
  { id: "b5", kind: "dinner", title: "Olmo, table for two", when: "Sat 18 Oct · 19:30", where: "Marylebone, London", ref: "OL-2281", status: "upcoming" },
  { id: "b6", kind: "hotel", title: "Casa Brava, 3 nights", when: "4 to 7 Sep", where: "Lisbon", ref: "CB-10277", status: "past" },
  { id: "b7", kind: "flight", title: "Flight BZ 2210, LGW to LIS", when: "4 Sep · 07:55", where: "Gatwick North", ref: "P2MM8R", status: "past" },
  { id: "b8", kind: "hotel", title: "Cottage near Hathersage", when: "Saved for November", where: "Peak District", ref: "Not booked", status: "saved" },
];

export type CalEvent = { day: number; start: number; len: number; title: string; tone: "violet" | "rose" | "amber" | "neutral"; where?: string; context?: string };

export const weekDays = ["Mon 13", "Tue 14", "Wed 15", "Thu 16", "Fri 17", "Sat 18", "Sun 19"];

export const calEvents: CalEvent[] = [
  { day: 0, start: 9, len: 1, title: "Planning", tone: "violet", where: "Room 2" },
  { day: 0, start: 18, len: 1, title: "Gym", tone: "amber", where: "Gym" },
  { day: 1, start: 9.5, len: 0.5, title: "Team stand-up", tone: "violet", where: "Video call" },
  { day: 1, start: 12.5, len: 1, title: "Lunch with Tomás", tone: "rose", where: "Rosa's, Soho", context: "Booking ref RS-118" },
  { day: 1, start: 15, len: 1, title: "Q4 project review", tone: "violet", where: "Room 4", context: "Priya shared the agenda by email" },
  { day: 1, start: 18.25, len: 1, title: "Strength session", tone: "amber", where: "Gym" },
  { day: 2, start: 9.5, len: 1, title: "Team sync", tone: "violet", where: "Video call" },
  { day: 2, start: 14, len: 4, title: "Travel to Edinburgh", tone: "neutral", where: "Heathrow T5", context: "Flight BZ 1452 at 16:20" },
  { day: 3, start: 10, len: 1.5, title: "Client visit", tone: "violet", where: "Quartermile, Edinburgh" },
  { day: 3, start: 19.5, len: 1.5, title: "Dinner at The Kitchin", tone: "rose", where: "Leith", context: "Booking ref TK-9031" },
  { day: 4, start: 7.5, len: 1, title: "Run", tone: "amber", where: "Arthur's Seat" },
  { day: 4, start: 11.25, len: 1, title: "Wrap-up call", tone: "violet", where: "Video call" },
  { day: 4, start: 13, len: 4.5, title: "Train home", tone: "neutral", where: "Waverley", context: "Coach C, seat 14" },
  { day: 5, start: 10, len: 1, title: "Yoga class", tone: "amber", where: "Studio" },
  { day: 5, start: 19.5, len: 2, title: "Dinner at Olmo", tone: "rose", where: "Marylebone" },
];

export const fitness = {
  steps: 8432,
  goal: 10000,
  distanceKm: 6.1,
  activeMin: [42, 61, 38, 75, 52, 27, 0],
  sleep: [
    { d: "M", h: 7.2 }, { d: "T", h: 6.4 }, { d: "W", h: 7.8 }, { d: "T", h: 6.9 }, { d: "F", h: 7.1 }, { d: "S", h: 8.3 }, { d: "S", h: 7.2 },
  ],
  workouts: [
    { when: "Tue 18:15", title: "Strength, upper body", len: "60 min", done: false },
    { when: "Thu 07:30", title: "Run, 5 km", len: "30 min", done: false },
    { when: "Sat 10:00", title: "Yoga class", len: "60 min", done: false },
    { when: "Mon 18:00", title: "Strength, lower body", len: "55 min", done: true },
  ],
};

export type Integration = { key: string; name: string; detail: string; connected: boolean };

export const initialConnections: Integration[] = [
  { key: "gmail", name: "Gmail", detail: "Email", connected: true },
  { key: "gcal", name: "Google Calendar", detail: "Calendar", connected: true },
  { key: "bank", name: "Current account", detail: "Banking", connected: true },
  { key: "invest", name: "Stocks & Shares ISA", detail: "Investments", connected: true },
  { key: "fitness", name: "Fitness tracker", detail: "Activity and sleep", connected: true },
  { key: "outlook", name: "Outlook", detail: "Email", connected: false },
  { key: "mscal", name: "Microsoft Calendar", detail: "Calendar", connected: false },
];
