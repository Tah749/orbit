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

/** Portfolio value at the end of each of the last 12 weeks, oldest first. */
export const portfolioHistory: number[] = [21240, 21410, 21180, 21690, 21960, 21820, 22310, 22550, 22410, 22980, 23320, 23870];

/** Monthly spending budgets by category. */
export const budgets: Partial<Record<Category, number>> = {
  groceries: 320,
  "eating-out": 220,
  transport: 120,
  entertainment: 80,
  shopping: 150,
};
