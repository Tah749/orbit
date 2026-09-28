import { startOfDay, ymd } from "../../time";
import { taskLists, type TaskList } from "../../data/tasks";

/**
 * Quick add: "Call the vet tomorrow #home !" becomes a title, a due date, a list and a priority.
 * Only simple, unambiguous phrases are understood; anything else stays in the title.
 */
export type Parsed = { title: string; due?: string; list?: TaskList; priority: boolean };

const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

const plus = (days: number, from = new Date()) => {
  const d = startOfDay(from);
  d.setDate(d.getDate() + days);
  return ymd(d);
};

/** The next time this weekday comes round, 1 to 7 days away. */
function nextWeekday(name: string) {
  const target = weekdays.findIndex((w) => w.startsWith(name.slice(0, 3)));
  const today = new Date().getDay();
  return plus(((target - today + 7) % 7) || 7);
}

/** A day and month, this year if it's still ahead, otherwise next year. */
function dayMonth(day: number, month: number) {
  const now = startOfDay();
  const d = new Date(now.getFullYear(), month, day);
  if (d.getMonth() !== month) return undefined;
  if (d < now) d.setFullYear(d.getFullYear() + 1);
  return ymd(d);
}

const monthIndex = (s: string) => months.indexOf(s.slice(0, 3).toLowerCase());
const W = "(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)";
const M = "(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)";
const lead = "(?:\\s+(?:on|by|due))?";

type Rule = { re: RegExp; due: (m: RegExpMatchArray) => string | undefined };

const rules: Rule[] = [
  { re: new RegExp(`${lead}\\s+(today|tonight)\\b`, "i"), due: () => plus(0) },
  { re: new RegExp(`${lead}\\s+(tomorrow|tmrw|tmr)\\b`, "i"), due: () => plus(1) },
  { re: /\s+next week\b/i, due: () => nextWeekday("monday") },
  { re: /\s+in (\d{1,3}) (day|days|week|weeks)\b/i, due: (m) => plus(Number(m[1]) * (m[2].startsWith("week") ? 7 : 1)) },
  { re: /\s+in a week\b/i, due: () => plus(7) },
  { re: new RegExp(`${lead}\\s+(?:next\\s+|this\\s+)?(${W})\\b`, "i"), due: (m) => nextWeekday(m[1].toLowerCase()) },
  { re: new RegExp(`${lead}\\s+(\\d{1,2})(?:st|nd|rd|th)?\\s+(${M})\\b`, "i"), due: (m) => dayMonth(Number(m[1]), monthIndex(m[2])) },
  { re: new RegExp(`${lead}\\s+(${M})\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b`, "i"), due: (m) => dayMonth(Number(m[2]), monthIndex(m[1])) },
  { re: new RegExp(`${lead}\\s+(\\d{1,2})/(\\d{1,2})\\b`, "i"), due: (m) => dayMonth(Number(m[1]), Number(m[2]) - 1) },
];

const listAliases: Record<string, TaskList> = { fern: "shop", ft: "shop", "f&t": "shop", fernandthread: "shop", shop: "shop" };

function findList(word: string): TaskList | undefined {
  const w = word.toLowerCase().replace(/[^a-z&]/g, "");
  if (!w) return undefined;
  if (listAliases[w]) return listAliases[w];
  return taskLists.find((l) => l.id.startsWith(w) || l.name.toLowerCase().replace(/[^a-z&]/g, "").startsWith(w))?.id;
}

export function parseQuick(input: string): Parsed {
  // Pad with a space so every rule can expect whitespace before its phrase.
  let text = ` ${input.trim()} `;
  let priority = false;
  let list: TaskList | undefined;
  let due: string | undefined;

  text = text.replace(/\s!{1,3}(?=\s)/g, () => ((priority = true), " "));
  text = text.replace(/(\S)!(?=\s*$)/, (_, c: string) => ((priority = true), c));

  text = text.replace(/\s#([\p{L}&]+)(?=\s)/gu, (whole, word: string) => {
    const found = findList(word);
    if (!found || list) return whole;
    list = found;
    return " ";
  });

  for (const r of rules) {
    const m = text.match(r.re);
    if (!m) continue;
    const d = r.due(m);
    if (!d) continue;
    due = d;
    text = text.replace(m[0], " ");
    break;
  }

  const title = text.replace(/\s+/g, " ").trim();
  return { title: title.charAt(0).toUpperCase() + title.slice(1), due, list, priority };
}
