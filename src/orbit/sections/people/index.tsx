import { useEffect, useState } from "react";
import { ArrowUpRight, MagnifyingGlass, Plus } from "@phosphor-icons/react";
import { db, newId, useDB } from "../../store";
import { go, href, useRoute } from "../../router";
import { daysFrom, longDate, on, relDay, stamp, time } from "../../time";
import type { Contact } from "../../data/life";
import { Avatar, Button, Empty, Facts, Field, Input, Label, Page, Section, Segmented, Select, Sheet, Source, Textarea, toast } from "../../ui";
import { addTask, MiniTask, when } from "../tasks/shared";

type Relation = Contact["relation"];
const relationName: Record<Relation, string> = { family: "Family", partner: "Partner", friend: "Friend", work: "Work", home: "Home" };
const filters = ["All", "Family", "Friends", "Work", "Home"] as const;
type Filter = (typeof filters)[number];
const inFilter = (c: Contact, f: Filter) =>
  f === "All" || (f === "Family" && (c.relation === "family" || c.relation === "partner")) || (f === "Friends" && c.relation === "friend") || c.relation === f.toLowerCase();

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** "Mum" for "Jan Rowe (Mum)", otherwise the first name. */
export const shortName = (c: Contact) => c.name.match(/\(([^)]+)\)/)?.[1] ?? c.name.split(" ")[0];

/** Names this person is likely to appear under in titles: first name and any nickname. */
function namesFor(c: Contact) {
  const alias = c.name.match(/\(([^)]+)\)/)?.[1];
  return [c.name.split(" ")[0], alias].filter(Boolean) as string[];
}
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const mentions = (text: string, c: Contact) => namesFor(c).some((n) => new RegExp(`(?<!\\p{L})${esc(n)}(?!\\p{L})`, "u").test(text));

/** The next birthday on or after today, as a date and a day count. */
export function nextBirthday(mmdd?: string) {
  if (!mmdd) return undefined;
  const [m, d] = mmdd.split("-").map(Number);
  const now = new Date();
  for (const y of [now.getFullYear(), now.getFullYear() + 1]) {
    const date = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const days = daysFrom(date);
    if (days >= 0) return { date, days };
  }
  return undefined;
}

function spoke(s?: string) {
  if (!s) return "no recent contact";
  const n = -daysFrom(s);
  if (n <= 0) return "spoke today";
  if (n === 1) return "spoke yesterday";
  if (n < 14) return `spoke ${n} days ago`;
  if (n < 60) return `spoke ${Math.round(n / 7)} weeks ago`;
  return `spoke ${Math.round(n / 30)} months ago`;
}

function sinceLine(days: number) {
  if (days < 63) return `about ${["", "", "", "", "four", "five", "six", "seven", "eight"][Math.round(days / 7)] || Math.round(days / 7)} weeks`;
  return `about ${Math.round(days / 30)} months`;
}

const birthdayText = (mmdd: string) => {
  const [m, d] = mmdd.split("-").map(Number);
  return `${d} ${months[m - 1]}`;
};

/* Add and edit --------------------------------------------------------------------------------------- */

type Draft = { name: string; relation: Relation; email: string; phone: string; day: string; month: string; notes: string };
const toDraft = (c?: Contact): Draft => ({
  name: c?.name ?? "",
  relation: c?.relation ?? "friend",
  email: c?.email ?? "",
  phone: c?.phone ?? "",
  day: c?.birthday ? String(Number(c.birthday.slice(3))) : "",
  month: c?.birthday ? String(Number(c.birthday.slice(0, 2))) : "",
  notes: c?.notes ?? "",
});
const fromDraft = (d: Draft): Partial<Contact> => ({
  name: d.name.trim(),
  relation: d.relation,
  email: d.email.trim() || undefined,
  phone: d.phone.trim() || undefined,
  birthday: d.day && d.month ? `${d.month.padStart(2, "0")}-${d.day.padStart(2, "0")}` : undefined,
  notes: d.notes.trim() || undefined,
});

function ContactForm({ draft, set }: { draft: Draft; set: (d: Draft) => void }) {
  const up = (k: keyof Draft) => (e: { target: { value: string } }) => set({ ...draft, [k]: e.target.value });
  return (
    <div className="flex flex-col gap-5">
      <Field label="Name">
        <Input value={draft.name} onChange={up("name")} autoFocus placeholder="First and last name" />
      </Field>
      <Field label="Relation">
        <Select value={draft.relation} onChange={up("relation")}>
          {(Object.keys(relationName) as Relation[]).map((r) => (
            <option key={r} value={r}>
              {relationName[r]}
            </option>
          ))}
        </Select>
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Phone">
          <Input type="tel" value={draft.phone} onChange={up("phone")} />
        </Field>
        <Field label="Email">
          <Input type="email" value={draft.email} onChange={up("email")} />
        </Field>
      </div>
      <div>
        <span className="text-[12.5px] font-medium text-ink">Birthday</span>
        <div className="mt-1.5 grid grid-cols-[88px_1fr] gap-2">
          <Select aria-label="Birthday day" value={draft.day} onChange={up("day")}>
            <option value="">Day</option>
            {Array.from({ length: 31 }, (_, i) => (
              <option key={i} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </Select>
          <Select aria-label="Birthday month" value={draft.month} onChange={up("month")}>
            <option value="">Month</option>
            {months.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <Field label="Notes">
        <Textarea value={draft.notes} onChange={up("notes")} placeholder="Things worth remembering" />
      </Field>
    </div>
  );
}

function NewContact({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [draft, setDraft] = useState<Draft>(toDraft());
  useEffect(() => {
    if (open) setDraft(toDraft());
  }, [open]);
  const save = () => {
    const c = { id: newId("ct"), source: "manual", ...fromDraft(draft) } as Contact;
    db.insert("contacts", c);
    onClose();
    toast(`${c.name} added`);
    go(`people/${c.id}`);
  };
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="New contact"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" disabled={!draft.name.trim()} onClick={save}>
            Add contact
          </Button>
        </>
      }
    >
      {open && <ContactForm draft={draft} set={setDraft} />}
    </Sheet>
  );
}

/* Details ------------------------------------------------------------------------------------------- */

function ContactSheet({ id, onClose }: { id?: string; onClose: () => void }) {
  const c = useDB((d) => (id ? d.contacts.find((x) => x.id === id) : undefined));
  const emails = useDB((d) => (c?.email ? d.messages.filter((m) => m.from.email === c.email).sort((a, b) => (a.date < b.date ? 1 : -1)) : []));
  const events = useDB((d) =>
    c
      ? d.events
          .filter((e) => daysFrom(e.start) >= 0 && (e.attendees?.includes(c.name) || e.links?.some((l) => l.kind === "contact" && l.id === c.id) || mentions(e.title, c)))
          .sort((a, b) => (a.start < b.start ? -1 : 1))
      : [],
  );
  const tasks = useDB((d) =>
    c ? d.tasks.filter((t) => (t.from?.kind === "contact" && t.from.id === c.id) || mentions(t.title, c)).sort((a, b) => Number(a.done) - Number(b.done)) : [],
  );
  const [editing, setEditing] = useState(false);
  const [armed, setArmed] = useState(false);
  const [draft, setDraft] = useState<Draft>(toDraft());
  useEffect(() => {
    setEditing(false);
    setArmed(false);
  }, [id]);

  const bday = nextBirthday(c?.birthday);

  const footer = !c ? undefined : editing ? (
    <>
      <Button variant="ghost" onClick={() => setEditing(false)}>
        Cancel
      </Button>
      <Button
        variant="primary"
        disabled={!draft.name.trim()}
        onClick={() => {
          db.patch("contacts", c.id, fromDraft(draft));
          setEditing(false);
          toast("Contact saved");
        }}
      >
        Save
      </Button>
    </>
  ) : armed ? (
    <>
      <span className="mr-auto self-center text-[13px] text-muted">Remove {shortName(c)}?</span>
      <Button variant="ghost" onClick={() => setArmed(false)}>
        Cancel
      </Button>
      <Button
        variant="danger"
        onClick={() => {
          db.remove("contacts", c.id);
          onClose();
          toast(`${c.name} removed`, { label: "Undo", run: () => db.insert("contacts", c) });
        }}
      >
        Remove
      </Button>
    </>
  ) : (
    <>
      <Button variant="danger" className="mr-auto" onClick={() => setArmed(true)}>
        Remove
      </Button>
      <Button
        variant="primary"
        onClick={() => {
          setDraft(toDraft(c));
          setEditing(true);
        }}
      >
        Edit
      </Button>
    </>
  );

  return (
    <Sheet open={!!c} onClose={onClose} title={c ? (editing ? "Edit contact" : c.name) : "Contact"} footer={footer}>
      {c && editing && <ContactForm draft={draft} set={setDraft} />}
      {c && !editing && (
        <div className="flex flex-col gap-7">
          <div className="flex items-center gap-3">
            <Avatar name={c.name} size={44} />
            <div className="min-w-0">
              <p className="text-[14px] text-ink">{relationName[c.relation]}</p>
              <p className="text-[12.5px] text-muted first-letter:uppercase">{spoke(c.lastContact)}</p>
            </div>
            <Source id={c.source} className="ml-auto" />
          </div>

          <Facts
            items={[
              ["Phone", c.phone ? <span className="tabular-nums">{c.phone}</span> : <span className="text-faint">Not added</span>],
              ["Email", c.email ? <span className="break-all">{c.email}</span> : <span className="text-faint">Not added</span>],
              [
                "Birthday",
                c.birthday ? (
                  <span>
                    {birthdayText(c.birthday)}
                    {bday && <span className="text-muted"> · {bday.days === 0 ? "today" : `in ${bday.days} days`}</span>}
                  </span>
                ) : (
                  <span className="text-faint">Not added</span>
                ),
              ],
            ]}
          />

          <Field label="Notes">
            <Textarea value={c.notes ?? ""} placeholder="Things worth remembering" onChange={(e) => db.patch("contacts", c.id, { notes: e.target.value || undefined })} />
          </Field>

          <Section title="Recent emails" meta={emails.length ? undefined : "None from them"}>
            {emails.length > 0 && (
              <ul className="divide-y divide-line border-y border-line">
                {emails.slice(0, 5).map((m) => (
                  <li key={m.id}>
                    <a href={href(`inbox/${m.id}`)} className="flex min-h-11 items-center gap-3 py-2 hover:bg-soft/60">
                      <span className="min-w-0 flex-1 truncate text-[14px] text-ink">{m.subject}</span>
                      <span className="shrink-0 text-[12.5px] tabular-nums text-muted">{stamp(m.date)}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Coming up together" meta={events.length ? undefined : "Nothing in the calendar"}>
            {events.length > 0 && (
              <ul className="divide-y divide-line border-y border-line">
                {events.slice(0, 5).map((e) => (
                  <li key={e.id}>
                    <a href={href(`calendar/${e.id}`)} className="flex min-h-11 items-center gap-3 py-2 hover:bg-soft/60">
                      <span className="min-w-0 flex-1 truncate text-[14px] text-ink">{e.title}</span>
                      <span className="shrink-0 text-[12.5px] tabular-nums text-muted">
                        {relDay(e.start)}
                        {!e.allDay && `, ${time(e.start)}`}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Tasks" meta={tasks.length ? undefined : "Nothing on your list"}>
            {tasks.length > 0 && <ul className="divide-y divide-line border-y border-line">{tasks.map((t) => <MiniTask key={t.id} task={t} />)}</ul>}
          </Section>
        </div>
      )}
    </Sheet>
  );
}

/* Side columns ---------------------------------------------------------------------------------------- */

function presentTaskFor(c: Contact) {
  return db.get().tasks.find((t) => !t.done && ((t.from?.kind === "contact" && t.from.id === c.id) || (mentions(t.title, c) && /present|gift/i.test(t.title))));
}

function ComingUp({ list }: { list: { c: Contact; date: string; days: number }[] }) {
  useDB((d) => d.tasks); // re-render when a reminder is added
  return (
    <Section title="Coming up" meta="Birthdays, next 60 days">
      {list.length === 0 ? (
        <p className="border-y border-line py-4 text-[13.5px] text-muted">No birthdays in the next two months.</p>
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {list.map(({ c, date, days }) => {
            const existing = presentTaskFor(c);
            return (
              <li key={c.id} className="flex gap-4 py-3.5">
                <div className="w-10 shrink-0 text-center">
                  <p className="font-serif text-[26px] leading-none text-ink tabular-nums">{Number(date.slice(8))}</p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-muted">{months[Number(date.slice(5, 7)) - 1].slice(0, 3)}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <a href={href(`people/${c.id}`)} className="block truncate text-[14px] text-ink hover:underline">
                    {c.name}
                  </a>
                  <p className="text-[12.5px] text-muted">
                    {days === 0 ? "Today" : days === 1 ? "Tomorrow" : `In ${days} days`}
                    {days > 1 && days < 7 ? `, ${relDay(date)}` : ""}
                  </p>
                  {existing ? (
                    <a href={href(`tasks/${existing.id}`)} className="mt-1.5 inline-flex items-center gap-1 text-[12.5px] text-accent hover:underline">
                      Present on your list{existing.due ? ` for ${when(existing.due)}` : ""}
                      <ArrowUpRight size={11} aria-hidden />
                    </a>
                  ) : (
                    <button
                      type="button"
                      className="mt-1.5 text-left text-[12.5px] text-ink underline decoration-line-strong underline-offset-[3px] hover:decoration-ink"
                      onClick={() => {
                        const due = days > 7 ? on(days - 7) : on(0);
                        const t = addTask({ title: `Buy a present for ${shortName(c)}`, due, list: "personal", from: { kind: "contact", id: c.id } });
                        toast(`Reminder added for ${when(due)}`, {
                          label: "Undo",
                          run: () => db.remove("tasks", t.id),
                        });
                      }}
                    >
                      Remind me to buy a present
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}

function CatchUp({ list }: { list: { c: Contact; days: number }[] }) {
  return (
    <Section title="Worth a catch-up">
      {list.length === 0 ? (
        <p className="border-y border-line py-4 text-[13.5px] text-muted">You've been in touch with everyone close recently.</p>
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {list.map(({ c, days }) => {
            const b = nextBirthday(c.birthday);
            return (
              <li key={c.id} className="py-3.5">
                <p className="font-serif text-[16.5px] leading-snug text-ink">
                  It's been {sinceLine(days)} since you and{" "}
                  <a href={href(`people/${c.id}`)} className="underline decoration-line-strong underline-offset-[3px] hover:decoration-ink">
                    {shortName(c)}
                  </a>{" "}
                  last spoke.
                  {b && b.days <= 60 && <span className="text-muted"> Their birthday is in {b.days} days, which is a good excuse.</span>}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const t = addTask({ title: `Call ${shortName(c)}`, due: on(1), list: "personal", from: { kind: "contact", id: c.id } });
                      toast("Added for tomorrow", { label: "Undo", run: () => db.remove("tasks", t.id) });
                    }}
                  >
                    Remind me tomorrow
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const prev = c.lastContact;
                      db.patch("contacts", c.id, { lastContact: new Date().toISOString() });
                      toast(`Marked as in touch with ${shortName(c)}`, { label: "Undo", run: () => db.patch("contacts", c.id, { lastContact: prev }) });
                    }}
                  >
                    We've spoken
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}

/* Page ---------------------------------------------------------------------------------------------- */

export default function PeoplePage() {
  const { rest } = useRoute();
  const openId = rest[0];
  const contacts = useDB((d) => d.contacts);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("All");
  const [sort, setSort] = useState<"name" | "recent">("name");
  const [adding, setAdding] = useState(false);

  const birthdays = contacts
    .map((c) => ({ c, ...nextBirthday(c.birthday)! }))
    .filter((x) => x.date && x.days <= 60)
    .sort((a, b) => a.days - b.days);
  const catchUp = contacts
    .filter((c) => ["family", "friend", "partner"].includes(c.relation) && c.lastContact)
    .map((c) => ({ c, days: -daysFrom(c.lastContact!) }))
    .filter((x) => x.days >= 30)
    .sort((a, b) => b.days - a.days);

  const needle = q.trim().toLowerCase();
  const shown = contacts
    .filter((c) => inFilter(c, filter))
    .filter((c) => !needle || [c.name, c.email, c.phone, c.notes].some((v) => v?.toLowerCase().includes(needle)))
    .sort((a, b) => (sort === "name" ? a.name.localeCompare(b.name) : (b.lastContact ?? "").localeCompare(a.lastContact ?? "")));

  const next = birthdays[0];
  const lede = next
    ? `${shortName(next.c)}'s birthday is ${next.days === 0 ? "today" : next.days === 1 ? "tomorrow" : `in ${next.days} days`}, on ${longDate(next.date).replace(/^\w+ /, "")}.`
    : "No birthdays in the next two months.";

  return (
    <Page
      title="People"
      lede={lede}
      actions={
        <Button variant="primary" onClick={() => setAdding(true)}>
          <Plus size={15} aria-hidden /> Add contact
        </Button>
      }
    >
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-12">
        <div className="min-w-0">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-[7px] border border-line bg-surface px-3 transition-colors focus-within:border-accent hover:border-line-strong">
              <MagnifyingGlass size={15} className="shrink-0 text-faint" aria-hidden />
              <span className="sr-only">Search people</span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name, email or note"
                className="min-w-0 flex-1 bg-transparent text-[14px] text-ink placeholder:text-faint focus:outline-none"
              />
            </label>
            <Select aria-label="Sort people" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="sm:w-44">
              <option value="name">Sort by name</option>
              <option value="recent">Recently in touch</option>
            </Select>
          </div>
          <div className="no-scrollbar mb-4 overflow-x-auto">
            <Segmented label="Filter by relation" items={filters} value={filter} onChange={setFilter} />
          </div>

          <div className="mb-2 flex items-baseline justify-between">
            <Label>
              {shown.length} {shown.length === 1 ? "person" : "people"}
            </Label>
          </div>
          {shown.length === 0 ? (
            <div className="border-t border-line">
              <Empty title="No one matches" action={needle || filter !== "All" ? <Button onClick={() => (setQ(""), setFilter("All"))}>Clear search</Button> : undefined}>
                Try a different name, or add them as a contact.
              </Empty>
            </div>
          ) : (
            <ul className="divide-y divide-line border-y border-line">
              {shown.map((c) => {
                const b = nextBirthday(c.birthday);
                return (
                  <li key={c.id}>
                    <a href={href(`people/${c.id}`)} className="flex min-h-[56px] items-center gap-3 px-1 py-2.5 transition-colors hover:bg-soft/60">
                      <Avatar name={c.name} size={34} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14.5px] text-ink">{c.name}</p>
                        <p className="truncate text-[12.5px] text-muted">
                          {relationName[c.relation]} · {spoke(c.lastContact)}
                          {b && b.days <= 14 && <span className="text-accent"> · birthday {b.days === 0 ? "today" : `in ${b.days} days`}</span>}
                        </p>
                      </div>
                      <Source id={c.source} className="max-sm:hidden" />
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="flex min-w-0 flex-col gap-10">
          <ComingUp list={birthdays} />
          <CatchUp list={catchUp} />
        </div>
      </div>

      <ContactSheet id={openId} onClose={() => go("people")} />
      <NewContact open={adding} onClose={() => setAdding(false)} />
    </Page>
  );
}
