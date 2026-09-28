import { at } from "../time";
import type { Ref, SourceId } from "./sources";

export type Person = { name: string; email: string };

export type MailCategory = "important" | "personal" | "work" | "updates" | "receipts" | "newsletters";

export type Message = {
  id: string;
  from: Person;
  to: Person[];
  subject: string;
  snippet: string;
  /** Paragraphs of the body. */
  body: string[];
  date: string;
  folder: "inbox" | "archive" | "sent" | "drafts";
  read: boolean;
  starred: boolean;
  category: MailCategory;
  /** Orbit thinks this needs a reply from you. */
  needsReply?: boolean;
  /** One line from Orbit explaining why it surfaced this. */
  why?: string;
  attachments?: { name: string; size: string }[];
  links?: Ref[];
  source: SourceId;
  /** Hidden from the inbox until this time (ISO datetime). */
  snoozedUntil?: string;
  /** A short reply Orbit drafted for messages that need one. Paragraphs are separated by a blank line. */
  suggestedReply?: string;
  /** On a sent message: the id of the message it replies to. */
  replyTo?: string;
  /** When you replied from Orbit. */
  repliedAt?: string;
};

const me: Person = { name: "Alex Rowe", email: "alex@rowe.example" };
const m = (x: Omit<Message, "to" | "folder" | "read" | "starred"> & Partial<Message>): Message => ({
  to: [me],
  folder: "inbox",
  read: false,
  starred: false,
  ...x,
});

export const messages: Message[] = [
  m({
    id: "msg-priya",
    from: { name: "Priya Shah", email: "priya@lumen.example" },
    subject: "Numbers for Thursday",
    snippet: "Could you send the final Q3 numbers before Thursday? The board pack goes out Friday morning.",
    body: [
      "Hi Alex,",
      "Could you send the final Q3 numbers before Thursday? The board pack goes out Friday morning and I'd like a day to check it.",
      "Revenue and retention are the two I need. The deck is attached with the slides that need filling in.",
      "Thanks,\nPriya",
    ],
    date: at(0, "08:42"),
    category: "work",
    needsReply: true,
    why: "Priya asked for something by Thursday",
    suggestedReply:
      "Hi Priya,\n\nYes, I'll have the final revenue and retention numbers to you by Wednesday evening, so you have Thursday to check them. I'll fill them straight into the slides in the deck.\n\nThanks,\nAlex",
    attachments: [{ name: "Q3-board-pack-draft.key", size: "4.2 MB" }],
    source: "gmail",
  }),
  m({
    id: "msg-brisa",
    from: { name: "Brisa Air", email: "bookings@brisa-air.example" },
    subject: "Check-in is open for BZ 1452 to Edinburgh",
    snippet: "Your flight departs tomorrow at 16:20 from London Heathrow Terminal 5. Check in now to choose your seat.",
    body: [
      "Hello Alex,",
      "Online check-in is now open for your flight BZ 1452 from London Heathrow (T5) to Edinburgh, departing tomorrow at 16:20.",
      "Booking reference: K7QX2M. Check in up to 1 hour before departure.",
    ],
    date: at(0, "07:05"),
    category: "important",
    why: "Check-in for tomorrow's flight is open",
    links: [{ kind: "booking", id: "bk-flight-out" }],
    source: "gmail",
  }),
  m({
    id: "msg-northgrid",
    from: { name: "Northgrid Energy", email: "billing@northgrid.example" },
    subject: "Your October bill is ready",
    snippet: "Your bill for £68.32 will be collected by Direct Debit on Friday.",
    body: [
      "Your October electricity bill is £68.32.",
      "It will be collected by Direct Debit from your Monzo account on Friday. That's £4.10 more than September, mostly because of colder evenings.",
    ],
    date: at(-1, "18:10"),
    read: true,
    category: "receipts",
    links: [{ kind: "bill", id: "bill-electric" }],
    source: "gmail",
  }),
  m({
    id: "msg-mum",
    from: { name: "Mum", email: "jan.rowe@example.com" },
    subject: "Sunday lunch?",
    snippet: "Are you and Sam still coming on Sunday? Dad's doing the roast. Let me know by Friday so I can order the lamb.",
    body: [
      "Hi love,",
      "Are you and Sam still coming on Sunday? Dad's doing the roast. Let me know by Friday so I can order the lamb.",
      "Lots of love, Mum x",
    ],
    date: at(-1, "20:31"),
    category: "personal",
    needsReply: true,
    why: "Mum needs an answer by Friday",
    suggestedReply: "Hi Mum,\n\nYes, we're both coming on Sunday. Tell Dad we can't wait for the roast. What time would you like us?\n\nLove, Alex x",
    source: "gmail",
  }),
  m({
    id: "msg-hotel",
    from: { name: "Hotel Calder", email: "stay@hotelcalder.example" },
    subject: "Your stay is confirmed",
    snippet: "Two nights from tomorrow. Check-in from 15:00, 21 Grassmarket, Edinburgh.",
    body: ["Thank you for booking with Hotel Calder.", "Two nights from tomorrow, Superior Double. Check-in from 15:00, check-out by 11:00.", "Reference HC-55120."],
    date: at(-6, "12:14"),
    read: true,
    category: "updates",
    links: [{ kind: "booking", id: "bk-hotel" }],
    source: "gmail",
  }),
  m({
    id: "msg-landlord",
    from: { name: "Tom Hughes", email: "tom.hughes@example.com" },
    subject: "Boiler service next week",
    snippet: "The engineer can come Tuesday or Wednesday morning. Which works for you?",
    body: ["Hi Alex,", "The boiler engineer can come next Tuesday or Wednesday morning, between 8 and 12. Which works better for you?", "Cheers, Tom"],
    date: at(-2, "09:20"),
    category: "personal",
    needsReply: true,
    why: "Your landlord is waiting to book the engineer",
    suggestedReply: "Hi Tom,\n\nWednesday morning works best for me. I'll be in from 8.\n\nThanks for sorting it,\nAlex",
    source: "gmail",
  }),
  m({
    id: "msg-parcel",
    from: { name: "Royal Mail", email: "no-reply@royalmail.example" },
    subject: "Your parcel is out for delivery",
    snippet: "Your parcel from Arlo & Co is out for delivery today between 11:00 and 13:00.",
    body: ["Your parcel from Arlo & Co is out for delivery today.", "Expected between 11:00 and 13:00. Tracking number RM 4471 2283 9GB."],
    date: at(0, "06:58"),
    category: "updates",
    links: [{ kind: "order", id: "ord-arlo" }],
    source: "gmail",
  }),
  m({
    id: "msg-shopify",
    from: { name: "Shopify", email: "no-reply@shopify.example" },
    subject: "Your payout of £412.60 is on its way",
    snippet: "A payout for Fern & Thread has been sent and should arrive in 2 working days.",
    body: ["A payout of £412.60 for Fern & Thread has been sent to your Starling account.", "It should arrive within 2 working days."],
    date: at(-1, "10:02"),
    read: true,
    category: "receipts",
    source: "gmail",
  }),
  m({
    id: "msg-insurer",
    from: { name: "Harbour Insurance", email: "renewals@harbour.example" },
    subject: "Your car insurance renews on the 24th",
    snippet: "Your renewal price is £486.20, up from £431.50 last year. You can review or change your cover online.",
    body: [
      "Your car insurance policy renews on the 24th.",
      "Your renewal price is £486.20, up from £431.50 last year. If you do nothing, your policy will renew automatically.",
    ],
    date: at(-3, "08:00"),
    category: "important",
    why: "Your renewal price went up by £54.70",
    links: [{ kind: "doc", id: "doc-car-insurance" }],
    source: "outlook",
  }),
  m({
    id: "msg-dan",
    from: { name: "Dan Okafor", email: "dan@okafor.example" },
    subject: "5-a-side Thursday?",
    snippet: "We're one short for Thursday. You in? 7pm at Market Road.",
    body: ["We're one short for Thursday. You in? 7pm at Market Road, usual pitch."],
    date: at(0, "11:15"),
    category: "personal",
    needsReply: true,
    suggestedReply: "Count me in. See you at Market Road just before 7.",
    source: "gmail",
  }),
  m({
    id: "msg-newsletter",
    from: { name: "The Weekend Edit", email: "hello@weekendedit.example" },
    subject: "Twelve things to do in London this weekend",
    snippet: "Late openings, a new market in Deptford and the best of the autumn exhibitions.",
    body: ["Late openings, a new market in Deptford and the best of the autumn exhibitions."],
    date: at(-1, "07:00"),
    read: true,
    category: "newsletters",
    source: "gmail",
  }),
  m({
    id: "msg-lumen-standup",
    from: { name: "Marcus Webb", email: "marcus@lumen.example" },
    subject: "Retro notes from Monday",
    snippet: "Notes from the retro are in the doc. Two actions for you: roadmap draft and the pricing page copy.",
    body: ["Notes from the retro are in the doc.", "Two actions for you: the roadmap draft and the pricing page copy. No rush on the copy."],
    date: at(-1, "16:40"),
    read: true,
    category: "work",
    source: "outlook",
  }),
  m({
    id: "msg-sent-sam",
    from: me,
    to: [{ name: "Sam Rowe", email: "sam@rowe.example" }],
    subject: "Edinburgh",
    snippet: "Booked the hotel. Flight's at 16:20 so we can leave from work.",
    body: ["Booked the hotel. Flight's at 16:20 so we can leave from work."],
    date: at(-6, "12:30"),
    folder: "sent",
    read: true,
    category: "personal",
    source: "gmail",
  }),
  m({
    id: "msg-lena",
    from: { name: "Lena Fischer", email: "lena@lumen.example" },
    subject: "Can we move our catch-up?",
    snippet: "Something's come up on Wednesday afternoon. Could we do Friday at 10 instead? Same room.",
    body: [
      "Hi Alex,",
      "Something's come up on Wednesday afternoon. Could we move our catch-up to Friday at 10 instead? Same room.",
      "If Friday is tricky, Monday morning also works.",
      "Lena",
    ],
    date: at(0, "09:57"),
    category: "work",
    needsReply: true,
    why: "Lena wants to move your catch-up",
    suggestedReply: "Hi Lena,\n\nFriday at 10 works for me. See you then.\n\nAlex",
    source: "outlook",
  }),
  m({
    id: "msg-dentist",
    from: { name: "Parkside Dental", email: "reception@parksidedental.example" },
    subject: "Your check-up is due",
    snippet: "It's been six months since your last check-up. Reply to this email or call us to book.",
    body: [
      "Dear Alex,",
      "It's been six months since your last check-up with Dr Morgan. Reply to this email or call the practice to book a time that suits you.",
      "Parkside Dental",
    ],
    date: at(-2, "14:05"),
    category: "updates",
    source: "gmail",
  }),
  m({
    id: "msg-halden",
    from: { name: "Halden Books", email: "orders@haldenbooks.example" },
    subject: "Your receipt for order 10442",
    snippet: "Thanks for your order. The Well-Tended Garden, £22.00, paid by card ending 4471.",
    body: ["Thanks for your order.", "The Well-Tended Garden (hardback), £22.00. Paid by card ending 4471.", "Your receipt is attached."],
    date: at(-4, "19:22"),
    read: true,
    category: "receipts",
    attachments: [{ name: "Receipt-10442.pdf", size: "88 KB" }],
    source: "gmail",
  }),
  m({
    id: "msg-slow-kitchen",
    from: { name: "The Slow Kitchen", email: "letters@slowkitchen.example" },
    subject: "Five soups for colder evenings",
    snippet: "Roast squash with sage, a proper minestrone and a ten-minute miso broth.",
    body: ["Roast squash with sage, a proper minestrone and a ten-minute miso broth.", "Plus: how to keep a batch of stock going all week."],
    date: at(-2, "06:30"),
    category: "newsletters",
    source: "gmail",
  }),
  m({
    id: "msg-climbing",
    from: { name: "Hollow Lane Climbing", email: "members@hollowlane.example" },
    subject: "Your membership freeze ends soon",
    snippet: "Your membership restarts on the 1st. Nothing to do if you're coming back.",
    body: ["Your membership freeze ends at the end of the month and your membership restarts on the 1st.", "Nothing to do if you're coming back. To extend the freeze, reply to this email."],
    date: at(-3, "12:40"),
    read: true,
    category: "updates",
    snoozedUntil: at(1, "08:00"),
    source: "gmail",
  }),
  m({
    id: "msg-council",
    from: { name: "Ashby Borough Council", email: "counciltax@ashby.example" },
    subject: "Your council tax account",
    snippet: "Your payment plan for this year is set up. The next instalment is on the 1st.",
    body: ["Your payment plan for this year is set up.", "The next instalment of £162.00 is collected on the 1st by Direct Debit."],
    date: at(-12, "10:15"),
    folder: "archive",
    read: true,
    category: "updates",
    source: "outlook",
  }),
  m({
    id: "msg-sent-marcus",
    from: me,
    to: [{ name: "Marcus Webb", email: "marcus@lumen.example" }],
    subject: "Re: Retro notes from Monday",
    snippet: "Thanks, got both. I'll have the roadmap draft over by next week.",
    body: ["Thanks, got both. I'll have the roadmap draft over by next week."],
    date: at(-1, "17:02"),
    folder: "sent",
    read: true,
    category: "work",
    replyTo: "msg-lumen-standup",
    source: "outlook",
  }),
  m({
    id: "msg-draft-garage",
    from: me,
    to: [{ name: "Castle Garage", email: "bookings@castlegarage.example" }],
    subject: "MOT for the Golf",
    snippet: "Hi, could I book the Golf in for its MOT some time next month? Mornings are best.",
    body: ["Hi,", "Could I book the Golf (LK19 XRT) in for its MOT some time next month? Mornings are best for me.", "Thanks,\nAlex Rowe"],
    date: at(-1, "21:48"),
    folder: "drafts",
    read: true,
    category: "personal",
    source: "gmail",
  }),
];
