import { at, on } from "../time";
import type { SourceId } from "./sources";

export type Account = {
  id: string;
  name: string;
  institution: SourceId;
  type: "current" | "savings" | "credit" | "business";
  balance: number;
  /** Last 4 digits. */
  mask: string;
  updatedAt: string;
};

export const accounts: Account[] = [
  { id: "acc-monzo", name: "Monzo current", institution: "monzo", type: "current", balance: 1842.37, mask: "4412", updatedAt: at(0, "08:55") },
  { id: "acc-monzo-save", name: "Rainy day pot", institution: "monzo", type: "savings", balance: 6250, mask: "4412", updatedAt: at(0, "08:55") },
  { id: "acc-starling", name: "Starling business", institution: "starling", type: "business", balance: 3120.84, mask: "9920", updatedAt: at(0, "08:40") },
  { id: "acc-amex", name: "Amex Gold", institution: "amex", type: "credit", balance: -612.18, mask: "1008", updatedAt: at(0, "06:12") },
];

export type Category =
  | "groceries"
  | "eating-out"
  | "transport"
  | "bills"
  | "shopping"
  | "entertainment"
  | "health"
  | "travel"
  | "income"
  | "transfers"
  | "business";

export const categoryName: Record<Category, string> = {
  groceries: "Groceries",
  "eating-out": "Eating out",
  transport: "Transport",
  bills: "Bills",
  shopping: "Shopping",
  entertainment: "Entertainment",
  health: "Health",
  travel: "Travel",
  income: "Income",
  transfers: "Transfers",
  business: "Business",
};

export type Txn = {
  id: string;
  accountId: string;
  date: string;
  merchant: string;
  /** Negative is money out. */
  amount: number;
  category: Category;
  pending?: boolean;
  note?: string;
};

let n = 0;
const t = (days: number, hhmm: string, merchant: string, amount: number, category: Category, accountId = "acc-monzo", pending = false): Txn => ({
  id: `tx-${++n}`,
  accountId,
  date: at(days, hhmm),
  merchant,
  amount,
  category,
  pending,
});

export const txns: Txn[] = [
  t(0, "08:12", "Pret A Manger", -4.35, "eating-out", "acc-monzo", true),
  t(0, "07:48", "TfL", -2.8, "transport", "acc-monzo", true),
  t(-1, "19:22", "Sainsbury's", -38.6, "groceries"),
  t(-1, "13:05", "Olmo", -24.0, "eating-out"),
  t(-1, "10:02", "Shopify payout", 412.6, "business", "acc-starling"),
  t(-2, "18:40", "Uber", -14.2, "transport", "acc-amex"),
  t(-2, "12:15", "Leon", -9.95, "eating-out"),
  t(-3, "20:10", "Netflix", -10.99, "entertainment", "acc-amex"),
  t(-3, "09:00", "Transfer to Rainy day pot", -150, "transfers"),
  t(-4, "17:55", "Waitrose", -52.14, "groceries"),
  t(-4, "11:30", "Boots", -12.49, "health"),
  t(-5, "21:04", "Deliveroo", -27.8, "eating-out", "acc-amex"),
  t(-5, "08:30", "Lumen Labs Ltd salary", 3450, "income"),
  t(-6, "15:12", "Arlo & Co", -64.0, "shopping", "acc-amex"),
  t(-6, "12:00", "Brisa Air", -186.4, "travel", "acc-amex"),
  t(-7, "19:40", "Everyman Cinema", -26.0, "entertainment"),
  t(-8, "10:10", "Council tax", -148.0, "bills"),
  t(-8, "09:55", "Thames Water", -38.2, "bills"),
  t(-9, "18:20", "Tesco", -31.75, "groceries"),
  t(-10, "12:40", "Packaging Direct", -46.8, "business", "acc-starling"),
  t(-11, "08:05", "Third Space", -95.0, "health"),
  t(-12, "20:15", "Dishoom", -41.5, "eating-out"),
  t(-13, "17:02", "Sainsbury's", -44.1, "groceries"),
  t(-14, "09:00", "Rent", -1450, "bills"),
  // Earlier weeks, so this month can be compared with last month.
  t(-15, "19:10", "Sainsbury's", -41.2, "groceries"),
  t(-15, "12:30", "Pret A Manger", -6.1, "eating-out"),
  t(-16, "08:40", "TfL", -6.8, "transport"),
  t(-16, "06:00", "Guardian News", -4.99, "entertainment", "acc-amex"),
  t(-17, "20:30", "Hawksmoor", -78.5, "eating-out", "acc-amex"),
  t(-18, "06:00", "Shopify", -25, "business", "acc-starling"),
  t(-18, "14:20", "Uniqlo", -39.9, "shopping", "acc-amex"),
  t(-19, "18:05", "Waitrose", -47.3, "groceries"),
  t(-20, "10:15", "Shopify payout", 388.2, "business", "acc-starling"),
  t(-20, "13:00", "Leon", -10.45, "eating-out"),
  t(-21, "06:00", "Wren Mobile", -18, "bills"),
  t(-21, "17:40", "TfL", -8.4, "transport"),
  t(-22, "11:00", "Boots", -8.99, "health"),
  t(-23, "19:30", "Tesco", -28.4, "groceries"),
  t(-24, "06:00", "Stratus", -7.99, "bills", "acc-amex"),
  t(-24, "21:15", "Deliveroo", -31.2, "eating-out", "acc-amex"),
  t(-25, "06:00", "Spotify", -16.99, "entertainment", "acc-amex"),
  t(-26, "06:00", "Lumen Fibre", -29.99, "bills"),
  t(-26, "12:10", "Olmo", -18.5, "eating-out"),
  t(-27, "06:00", "Northgrid Energy", -64.22, "bills"),
  t(-27, "18:55", "Sainsbury's", -36.8, "groceries"),
  t(-28, "20:00", "Barbican", -42, "entertainment", "acc-amex"),
  t(-29, "06:00", "Chapterhouse Audio", -8.99, "entertainment", "acc-amex"),
  t(-29, "10:30", "Waterstones", -22.99, "shopping"),
  t(-30, "08:20", "Uber", -11.6, "transport", "acc-amex"),
  t(-31, "19:45", "Waitrose", -58.9, "groceries"),
  t(-32, "13:10", "Pret A Manger", -5.45, "eating-out"),
  t(-33, "09:00", "Transfer to Rainy day pot", -150, "transfers"),
  t(-33, "20:10", "Netflix", -10.99, "entertainment", "acc-amex"),
  t(-34, "15:30", "Packaging Direct", -38.2, "business", "acc-starling"),
  t(-35, "08:30", "Lumen Labs Ltd salary", 3450, "income"),
  t(-35, "19:00", "Dishoom", -46.0, "eating-out", "acc-amex"),
  t(-36, "11:45", "Arlo & Co", -28, "shopping", "acc-amex"),
  t(-37, "18:30", "Tesco", -33.6, "groceries"),
  t(-38, "10:10", "Council tax", -148, "bills"),
  t(-38, "09:55", "Thames Water", -38.2, "bills"),
  t(-39, "08:10", "TfL", -7.2, "transport"),
  t(-40, "12:00", "Boots", -15.3, "health"),
  t(-41, "08:00", "Third Space", -95, "health"),
  t(-42, "19:20", "Sainsbury's", -42.75, "groceries"),
  t(-43, "21:30", "Everyman Cinema", -24, "entertainment"),
  t(-44, "09:00", "Rent", -1450, "bills"),
  t(-45, "13:20", "Leon", -9.45, "eating-out"),
  t(-46, "06:00", "Guardian News", -4.99, "entertainment", "acc-amex"),
  t(-47, "10:00", "Shopify payout", 296.4, "business", "acc-starling"),
  t(-48, "18:10", "Waitrose", -49.6, "groceries"),
  t(-49, "06:00", "Shopify", -25, "business", "acc-starling"),
  t(-50, "14:00", "COS", -85, "shopping", "acc-amex"),
  t(-51, "06:00", "Wren Mobile", -18, "bills"),
  t(-52, "20:40", "Bao", -34.5, "eating-out", "acc-amex"),
  t(-53, "19:05", "Tesco", -29.9, "groceries"),
  t(-54, "06:00", "Stratus", -7.99, "bills", "acc-amex"),
  t(-55, "06:00", "Spotify", -16.99, "entertainment", "acc-amex"),
  t(-55, "17:30", "TfL", -9.6, "transport"),
  t(-56, "06:00", "Lumen Fibre", -29.99, "bills"),
  t(-57, "06:00", "Northgrid Energy", -64.22, "bills"),
  t(-57, "18:40", "Sainsbury's", -39.4, "groceries"),
  t(-58, "12:15", "Pret A Manger", -4.95, "eating-out"),
  t(-59, "06:00", "Chapterhouse Audio", -8.99, "entertainment", "acc-amex"),
  t(-59, "19:30", "Uber", -16.8, "transport", "acc-amex"),
  t(-61, "19:00", "Waitrose", -44.2, "groceries"),
  t(-62, "09:00", "Transfer to Rainy day pot", -150, "transfers"),
];

export type Bill = {
  id: string;
  name: string;
  payee: string;
  amount: number;
  /** YYYY-MM-DD */
  due: string;
  recurrence: "weekly" | "monthly" | "quarterly" | "yearly" | "once";
  kind: "bill" | "subscription";
  category: "housing" | "utilities" | "insurance" | "tax" | "phone" | "streaming" | "software" | "fitness" | "other";
  autopay: boolean;
  status: "upcoming" | "paid" | "overdue";
  accountId: string;
  /** Previous amount, if it changed. */
  previous?: number;
  source: SourceId;
  /** When it was last marked as paid in Orbit. */
  lastPaid?: string;
  /** Last sign the subscription was used, and where that came from. */
  lastUsed?: string;
  usageSource?: SourceId;
  /** What counts as use, e.g. "download receipt". */
  usageSign?: string;
};

export const bills: Bill[] = [
  { id: "bill-electric", name: "Electricity", payee: "Northgrid Energy", amount: 68.32, previous: 64.22, due: on(3), recurrence: "monthly", kind: "bill", category: "utilities", autopay: true, status: "upcoming", accountId: "acc-monzo", source: "gmail" },
  { id: "bill-broadband", name: "Broadband", payee: "Lumen Fibre", amount: 29.99, due: on(4), recurrence: "monthly", kind: "bill", category: "utilities", autopay: true, status: "upcoming", accountId: "acc-monzo", source: "gmail" },
  { id: "bill-phone", name: "Mobile", payee: "Wren Mobile", amount: 18.0, due: on(9), recurrence: "monthly", kind: "bill", category: "phone", autopay: true, status: "upcoming", accountId: "acc-monzo", source: "monzo" },
  { id: "bill-car", name: "Car insurance", payee: "Harbour Insurance", amount: 486.2, previous: 431.5, due: on(10), recurrence: "yearly", kind: "bill", category: "insurance", autopay: true, status: "upcoming", accountId: "acc-amex", source: "outlook" },
  { id: "bill-rent", name: "Rent", payee: "Tom Hughes", amount: 1450, due: on(16), recurrence: "monthly", kind: "bill", category: "housing", autopay: false, status: "upcoming", accountId: "acc-monzo", source: "monzo" },
  { id: "bill-council", name: "Council tax", payee: "Islington Council", amount: 148, due: on(22), recurrence: "monthly", kind: "bill", category: "tax", autopay: true, status: "upcoming", accountId: "acc-monzo", source: "monzo" },
  { id: "bill-water", name: "Water", payee: "Thames Water", amount: 38.2, due: on(22), recurrence: "monthly", kind: "bill", category: "utilities", autopay: true, status: "upcoming", accountId: "acc-monzo", source: "monzo" },
  { id: "sub-netflix", name: "Netflix", payee: "Netflix", amount: 10.99, due: on(27), recurrence: "monthly", kind: "subscription", category: "streaming", autopay: true, status: "upcoming", accountId: "acc-amex", source: "amex" },
  { id: "sub-spotify", name: "Spotify Duo", payee: "Spotify", amount: 16.99, due: on(5), recurrence: "monthly", kind: "subscription", category: "streaming", autopay: true, status: "upcoming", accountId: "acc-amex", source: "amex" },
  { id: "sub-cloud", name: "Cloud storage", payee: "Stratus", amount: 7.99, due: on(6), recurrence: "monthly", kind: "subscription", category: "software", autopay: true, status: "upcoming", accountId: "acc-amex", source: "gmail" },
  { id: "sub-gym", name: "Third Space", payee: "Third Space", amount: 95, due: on(19), recurrence: "monthly", kind: "subscription", category: "fitness", autopay: true, status: "upcoming", accountId: "acc-monzo", source: "monzo" },
  { id: "sub-shopify", name: "Shopify Basic", payee: "Shopify", amount: 25, due: on(12), recurrence: "monthly", kind: "subscription", category: "software", autopay: true, status: "upcoming", accountId: "acc-starling", source: "shopify" },
  { id: "sub-news", name: "The Observer", payee: "Guardian News", amount: 5.99, previous: 4.99, due: on(14), recurrence: "monthly", kind: "subscription", category: "other", autopay: true, status: "upcoming", accountId: "acc-amex", source: "amex" },
  { id: "sub-audio", name: "Chapterhouse Audio", payee: "Chapterhouse Audio", amount: 8.99, due: on(1), recurrence: "monthly", kind: "subscription", category: "other", autopay: true, status: "upcoming", accountId: "acc-amex", source: "amex", lastUsed: at(-66, "21:40"), usageSource: "gmail", usageSign: "download receipt" },
];

export type Holding = {
  id: string;
  broker: SourceId;
  account: "ISA" | "GIA" | "SIPP";
  name: string;
  ticker: string;
  units: number;
  price: number;
  /** Total cost basis. */
  cost: number;
};

export const holdings: Holding[] = [
  { id: "h-vwrl", broker: "trading212", account: "ISA", name: "Vanguard FTSE All-World ETF", ticker: "VWRP", units: 96.4, price: 118.42, cost: 9800 },
  { id: "h-isf", broker: "trading212", account: "ISA", name: "iShares Core FTSE 100 ETF", ticker: "ISF", units: 410, price: 8.62, cost: 3280 },
  { id: "h-lsgs", broker: "vanguard", account: "SIPP", name: "LifeStrategy 80% Equity", ticker: "VLS80", units: 21.8, price: 262.1, cost: 5100 },
  { id: "h-igl", broker: "trading212", account: "ISA", name: "iShares UK Gilts ETF", ticker: "IGLT", units: 180, price: 10.14, cost: 1880 },
  { id: "h-msft", broker: "trading212", account: "GIA", name: "Microsoft", ticker: "MSFT", units: 3, price: 331.2, cost: 890 },
];

/** Portfolio value at the end of each of the last 11 weeks, oldest first. Today's value comes from the holdings. */
export const portfolioHistory: number[] = [20880, 21050, 20830, 21310, 21590, 21460, 21940, 22170, 22040, 22610, 23050];

/** Monthly spending budgets by category. */
export const budgets: Partial<Record<Category, number>> = {
  groceries: 320,
  "eating-out": 220,
  transport: 120,
  entertainment: 80,
  shopping: 150,
};
