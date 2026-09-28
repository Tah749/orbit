/** Where a piece of information came from. Every item in the app carries one, so answers can cite it. */
export type SourceId =
  | "gmail"
  | "outlook"
  | "google-calendar"
  | "outlook-calendar"
  | "icloud"
  | "monzo"
  | "starling"
  | "amex"
  | "trading212"
  | "vanguard"
  | "shopify"
  | "stripe"
  | "etsy"
  | "strava"
  | "apple-health"
  | "todoist"
  | "royal-mail"
  | "dvla"
  | "manual"
  | "orbit";

export const sourceName: Record<SourceId, string> = {
  gmail: "Gmail",
  outlook: "Outlook",
  "google-calendar": "Google Calendar",
  "outlook-calendar": "Outlook Calendar",
  icloud: "iCloud",
  monzo: "Monzo",
  starling: "Starling",
  amex: "American Express",
  trading212: "Trading 212",
  vanguard: "Vanguard",
  shopify: "Shopify",
  stripe: "Stripe",
  etsy: "Etsy",
  strava: "Strava",
  "apple-health": "Apple Health",
  todoist: "Todoist",
  "royal-mail": "Royal Mail",
  dvla: "DVLA",
  manual: "Added by you",
  orbit: "Orbit",
};

/** A link from one item to another ("this task came from that email"). */
export type Ref = { kind: "message" | "event" | "task" | "bill" | "booking" | "order" | "doc" | "contact" | "txn"; id: string };
