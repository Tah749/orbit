import { at, on } from "../time";
import type { SourceId } from "./sources";

export type BookingKind = "flight" | "hotel" | "train" | "restaurant" | "event" | "car";

export type Booking = {
  id: string;
  kind: BookingKind;
  title: string;
  provider: string;
  start: string;
  end?: string;
  ref: string;
  /** Short facts shown on the card: "Terminal" → "5". */
  details: [string, string][];
  tripId?: string;
  status: "confirmed" | "checked-in" | "changed" | "cancelled";
  source: SourceId;
};

export type Trip = {
  id: string;
  title: string;
  destination: string;
  start: string;
  end: string;
  travellers: string[];
};

export const trips: Trip[] = [
  { id: "trip-edi", title: "Edinburgh", destination: "Edinburgh, Scotland", start: on(1), end: on(3), travellers: ["Alex", "Sam"] },
  { id: "trip-lis", title: "Lisbon", destination: "Lisbon, Portugal", start: on(38), end: on(42), travellers: ["Alex", "Sam"] },
];

export const bookings: Booking[] = [
  {
    id: "bk-flight-out", kind: "flight", title: "BZ 1452 · LHR to EDI", provider: "Brisa Air", start: at(1, "16:20"), end: at(1, "17:45"), ref: "K7QX2M",
    details: [["Terminal", "5"], ["Seats", "14A, 14B"], ["Bags", "1 cabin each"]], tripId: "trip-edi", status: "confirmed", source: "gmail",
  },
  {
    id: "bk-hotel", kind: "hotel", title: "Hotel Calder", provider: "Hotel Calder", start: at(1, "15:00"), end: at(3, "11:00"), ref: "HC-55120",
    details: [["Room", "Superior Double"], ["Address", "21 Grassmarket"], ["Breakfast", "Included"]], tripId: "trip-edi", status: "confirmed", source: "gmail",
  },
  {
    id: "bk-dinner", kind: "restaurant", title: "The Kitchin", provider: "OpenTable", start: at(2, "19:30"), ref: "OT-88412",
    details: [["Table for", "2"], ["Address", "78 Commercial Quay, Leith"]], tripId: "trip-edi", status: "confirmed", source: "gmail",
  },
  {
    id: "bk-flight-back", kind: "flight", title: "BZ 1459 · EDI to LHR", provider: "Brisa Air", start: at(3, "18:05"), end: at(3, "19:30"), ref: "K7QX2M",
    details: [["Terminal", "Main"], ["Seats", "Not chosen"]], tripId: "trip-edi", status: "confirmed", source: "gmail",
  },
  {
    id: "bk-olmo", kind: "restaurant", title: "Olmo, Marylebone", provider: "SevenRooms", start: at(4, "19:30"), ref: "OL-2281",
    details: [["Table for", "2"], ["Address", "14 Blandford Street"]], status: "confirmed", source: "gmail",
  },
  {
    id: "bk-gig", kind: "event", title: "Nils Frahm at the Barbican", provider: "Ticketmaster", start: at(12, "19:30"), ref: "TM-2029-4471",
    details: [["Seats", "Stalls, Row K 18-19"], ["Doors", "18:45"]], status: "confirmed", source: "gmail",
  },
  {
    id: "bk-lis-flight", kind: "flight", title: "TP 1353 · LGW to LIS", provider: "TAP Air Portugal", start: at(38, "07:10"), end: at(38, "10:05"), ref: "ZP4R8Q",
    details: [["Terminal", "South"], ["Bags", "1 hold, 2 cabin"]], tripId: "trip-lis", status: "confirmed", source: "gmail",
  },
  {
    id: "bk-lis-stay", kind: "hotel", title: "Casa do Largo (Airbnb)", provider: "Airbnb", start: at(38, "15:00"), end: at(42, "11:00"), ref: "HMX2K9",
    details: [["Host", "Inês"], ["Area", "Alfama"]], tripId: "trip-lis", status: "confirmed", source: "gmail",
  },
];

export type OrderStatus = "ordered" | "dispatched" | "out-for-delivery" | "delivered" | "returned";

export type Order = {
  id: string;
  retailer: string;
  items: { name: string; qty: number; price: number }[];
  total: number;
  orderedAt: string;
  status: OrderStatus;
  carrier?: string;
  tracking?: string;
  /** Expected delivery date or window start. */
  eta?: string;
  /** Last day to return, YYYY-MM-DD. */
  returnBy?: string;
  events: { at: string; text: string }[];
  source: SourceId;
};

export const orders: Order[] = [
  {
    id: "ord-arlo", retailer: "Arlo & Co", items: [{ name: "Wool overshirt, olive, M", qty: 1, price: 64 }], total: 64, orderedAt: at(-6, "15:12"), status: "out-for-delivery",
    carrier: "Royal Mail", tracking: "RM 4471 2283 9GB", eta: at(0, "11:00"), returnBy: on(24),
    events: [{ at: at(-6, "15:12"), text: "Order placed" }, { at: at(-4, "09:40"), text: "Dispatched" }, { at: at(0, "06:58"), text: "Out for delivery, 11:00 to 13:00" }], source: "gmail",
  },
  {
    id: "ord-books", retailer: "Hive Books", items: [{ name: "The Well Gardened Mind", qty: 1, price: 12.99 }, { name: "Gift wrap", qty: 1, price: 2.5 }], total: 15.49, orderedAt: at(-1, "21:30"), status: "dispatched",
    carrier: "Evri", tracking: "H01HYA0012345678", eta: at(2, "09:00"),
    events: [{ at: at(-1, "21:30"), text: "Order placed" }, { at: at(0, "05:10"), text: "Dispatched" }], source: "gmail",
  },
  {
    id: "ord-amazon", retailer: "Amazon", items: [{ name: "USB-C travel charger", qty: 1, price: 24.99 }], total: 24.99, orderedAt: at(0, "07:30"), status: "ordered",
    eta: at(1, "07:00"), events: [{ at: at(0, "07:30"), text: "Order placed" }], source: "gmail",
  },
  {
    id: "ord-shoes", retailer: "Northside Running", items: [{ name: "Trail shoes, UK 9", qty: 1, price: 110 }], total: 110, orderedAt: at(-18, "12:00"), status: "delivered",
    carrier: "DPD", tracking: "15501234567890", eta: at(-15, "10:00"), returnBy: on(12),
    events: [{ at: at(-18, "12:00"), text: "Order placed" }, { at: at(-16, "08:00"), text: "Dispatched" }, { at: at(-15, "10:42"), text: "Delivered to front door" }], source: "gmail",
  },
];
