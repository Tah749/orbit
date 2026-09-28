import { useEffect, useState, type ReactNode } from "react";
import { Plus } from "@phosphor-icons/react";
import { db, newId, useDB } from "../../store";
import { go, href, useRoute } from "../../router";
import { daysFrom, inDays, on, parse, stamp, ymd } from "../../time";
import type { Doc, DocKind } from "../../data/life";
import type { Trip } from "../../data/plans";
import type { TaskList } from "../../data/tasks";
import { Button, cx, Empty, Facts, Field, Input, Label, Page, Panel, Section, Segmented, Select, Sheet, Source, Textarea, toast } from "../../ui";
import { addTask, MiniTask, when } from "../tasks/shared";

const kindName: Record<DocKind, string> = {
  passport: "Passport",
  licence: "Licence",
  insurance: "Insurance",
  mot: "MOT",
  tax: "Vehicle tax",
  "tv-licence": "TV Licence",
  warranty: "Warranty",
  tenancy: "Tenancy",
  health: "Health",
  other: "Other",
};

const renews: DocKind[] = ["insurance", "tax", "tv-licence", "tenancy"];
const verb = (k: DocKind) => (renews.includes(k) ? "Renews" : k === "mot" ? "Due" : "Expires");

const fullDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" });
const monthShort = new Intl.DateTimeFormat("en-GB", { month: "short" });
const soon = (d: Doc) => !!d.expires && daysFrom(d.expires) <= 14;

function left(days: number) {
  if (days < 0) return `${-days} ${days === -1 ? "day" : "days"} ago`;
  if (days <= 60) return inDays(on(days));
  if (days < 120) return `in ${Math.round(days / 7)} weeks`;
  if (days < 730) return `in ${Math.round(days / 30.4)} months`;
  return `in ${Math.floor(days / 365)} years`;
}

/** Passports: flag when fewer than six months will be left, now or on a planned trip. */
function passportNote(d: Doc, trips: Trip[]): string | undefined {
  if (d.kind !== "passport" || !d.expires) return undefined;
  const remaining = daysFrom(d.expires);
  if (remaining < 183) return "Under 6 months left. Some countries ask for at least 6 months on arrival, so check before you book travel.";
  const first = d.holder?.split(" ")[0];
  const trip = trips
    .filter((t) => daysFrom(t.end) >= 0 && (!first || t.travellers.includes(first)))
    .find((t) => remaining - daysFrom(t.end) < 183);
  if (trip) return `By the time you're back from ${trip.title} it will have under 6 months left. Some countries ask for that much, so check the entry rules.`;
  return undefined;
}

const lcFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
function reminderTitle(d: Doc) {
  const name = /^[A-Z]{2,}/.test(d.title) ? d.title : lcFirst(d.title);
  if (d.kind === "mot") return `Book ${name}`;
  if (d.kind === "warranty") return `Review ${name}`;
  if (d.kind === "tenancy") return `Decide on ${name}`;
  return `Renew ${name}`;
}
const reminderList = (d: Doc): TaskList => (["tenancy", "tv-licence"].includes(d.kind) ? "home" : "personal");

/* Rows ---------------------------------------------------------------------------------------------- */

function DateBlock({ date }: { date?: string }) {
  if (!date) return <div className="w-11 shrink-0 pt-0.5 text-center font-mono text-[10px] uppercase tracking-[0.1em] text-faint">None</div>;
  const d = parse(date);
  return (
    <div className="w-11 shrink-0 text-center">
      <p className="font-serif text-[24px] leading-none text-ink tabular-nums">{d.getDate()}</p>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-muted">
        {monthShort.format(d)}
        {d.getFullYear() !== new Date().getFullYear() && <span className="block text-faint">{d.getFullYear()}</span>}
      </p>
    </div>
  );
}

function DocRow({ doc, note }: { doc: Doc; note?: string }) {
  const days = doc.expires ? daysFrom(doc.expires) : undefined;
  return (
    <li>
      <a href={href(`admin/${doc.id}`)} className="flex gap-4 px-1 py-3.5 transition-colors hover:bg-soft/60">
        <DateBlock date={doc.expires} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <p className="min-w-0 truncate text-[14.5px] text-ink">{doc.title}</p>
            {days !== undefined && (
              <span className={cx("shrink-0 text-[12.5px] tabular-nums", soon(doc) ? "font-medium text-coral" : "text-muted")}>{left(days)}</span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-muted">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.1em]">{kindName[doc.kind]}</span>
            {doc.holder && <span>{doc.holder}</span>}
            {doc.reference && <span className="font-mono text-[11.5px] tabular-nums">{doc.reference}</span>}
            <Source id={doc.source} />
          </div>
          {note && <p className="mt-2 max-w-[62ch] text-[12.5px] leading-relaxed text-warn">{note}</p>}
        </div>
      </a>
    </li>
  );
}

function Car({ docs }: { docs: Doc[] }) {
  if (!docs.length) return null;
  const order: DocKind[] = ["mot", "tax", "insurance"];
  const sorted = [...docs].sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind));
  return (
    <Section title="Car" meta={docs[0].vehicle}>
      <Panel>
        <ul className="divide-y divide-line">
          {sorted.map((d) => {
            const days = d.expires ? daysFrom(d.expires) : undefined;
            return (
              <li key={d.id}>
                <a href={href(`admin/${d.id}`)} className="flex items-center gap-3 px-4 py-3 transition-colors first:rounded-t-[10px] hover:bg-soft/60">
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] text-ink">{d.kind === "insurance" ? "Insurance" : kindName[d.kind]}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2.5 text-[12.5px] text-muted">
                      {d.expires ? `${verb(d.kind)} ${fullDate.format(parse(d.expires)).replace(/ \d{4}$/, "")}` : "No date"}
                      <Source id={d.source} />
                    </p>
                  </div>
                  {days !== undefined && <span className={cx("shrink-0 text-[12.5px] tabular-nums", soon(d) ? "font-medium text-coral" : "text-muted")}>{left(days)}</span>}
                </a>
              </li>
            );
          })}
        </ul>
      </Panel>
    </Section>
  );
}

/* Add and edit --------------------------------------------------------------------------------------- */

type Draft = { title: string; kind: DocKind; expires: string; holder: string; reference: string; vehicle: string; notes: string };
const toDraft = (d?: Doc): Draft => ({
  title: d?.title ?? "",
  kind: d?.kind ?? "other",
  expires: d?.expires ?? "",
  holder: d?.holder ?? "",
  reference: d?.reference ?? "",
  vehicle: d?.vehicle ?? "",
  notes: d?.notes ?? "",
});
const fromDraft = (d: Draft): Partial<Doc> => ({
  title: d.title.trim(),
  kind: d.kind,
  expires: d.expires || undefined,
  holder: d.holder.trim() || undefined,
  reference: d.reference.trim() || undefined,
  vehicle: d.vehicle.trim().toUpperCase() || undefined,
  notes: d.notes.trim() || undefined,
});

function DocForm({ draft, set }: { draft: Draft; set: (d: Draft) => void }) {
  const up = (k: keyof Draft) => (e: { target: { value: string } }) => set({ ...draft, [k]: e.target.value });
  const car = ["mot", "tax", "insurance"].includes(draft.kind);
  return (
    <div className="flex flex-col gap-5">
      <Field label="Name">
        <Input value={draft.title} onChange={up("title")} autoFocus placeholder="Home insurance" />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Kind">
          <Select value={draft.kind} onChange={up("kind")}>
            {(Object.keys(kindName) as DocKind[]).map((k) => (
              <option key={k} value={k}>
                {kindName[k]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Expires or renews">
          <Input type="date" value={draft.expires} onChange={up("expires")} />
        </Field>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Holder">
          <Input value={draft.holder} onChange={up("holder")} placeholder="Whose it is" />
        </Field>
        <Field label="Reference">
          <Input value={draft.reference} onChange={up("reference")} placeholder="Policy or document number" />
        </Field>
      </div>
      {car && (
        <Field label="Vehicle registration" hint="Groups it with the car.">
          <Input value={draft.vehicle} onChange={up("vehicle")} placeholder="AB12 CDE" />
        </Field>
      )}
      <Field label="Notes">
        <Textarea value={draft.notes} onChange={up("notes")} />
      </Field>
    </div>
  );
}

function NewDoc({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [draft, setDraft] = useState<Draft>(toDraft());
  useEffect(() => {
    if (open) setDraft(toDraft());
  }, [open]);
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Add a document"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!draft.title.trim()}
            onClick={() => {
              const d = { id: newId("doc"), source: "manual", ...fromDraft(draft) } as Doc;
              db.insert("docs", d);
              onClose();
              toast(`${d.title} added`, { label: "Undo", run: () => db.remove("docs", d.id) });
            }}
          >
            Add document
          </Button>
        </>
      }
    >
      {open && <DocForm draft={draft} set={setDraft} />}
    </Sheet>
  );
}

/* Details ------------------------------------------------------------------------------------------- */

const leads = ["7 days", "14 days", "30 days"] as const;

function DocSheet({ id, onClose }: { id?: string; onClose: () => void }) {
  const doc = useDB((d) => (id ? d.docs.find((x) => x.id === id) : undefined));
  const trips = useDB((d) => d.trips);
  const emails = useDB((d) => (id ? d.messages.filter((m) => m.links?.some((l) => l.kind === "doc" && l.id === id)) : []));
  const reminders = useDB((d) => (id ? d.tasks.filter((t) => t.from?.kind === "doc" && t.from.id === id) : []));
  const [lead, setLead] = useState<(typeof leads)[number]>("14 days");
  const [editing, setEditing] = useState(false);
  const [armed, setArmed] = useState(false);
  const [draft, setDraft] = useState<Draft>(toDraft());
  useEffect(() => {
    setEditing(false);
    setArmed(false);
  }, [id]);

  const addReminder = (d: Doc) => {
    const back = parseInt(lead, 10);
    const target = parse(d.expires!);
    target.setDate(target.getDate() - back);
    const due = ymd(target) < on(0) ? on(0) : ymd(target);
    const t = addTask({ title: reminderTitle(d), due, list: reminderList(d), from: { kind: "doc", id: d.id } });
    toast(`Reminder set for ${when(due)}`, { label: "Undo", run: () => db.remove("tasks", t.id) });
  };

  let footer: ReactNode = undefined;
  if (doc) {
    footer = editing ? (
      <>
        <Button variant="ghost" onClick={() => setEditing(false)}>
          Cancel
        </Button>
        <Button
          variant="primary"
          disabled={!draft.title.trim()}
          onClick={() => {
            db.patch("docs", doc.id, fromDraft(draft));
            setEditing(false);
            toast("Saved");
          }}
        >
          Save
        </Button>
      </>
    ) : armed ? (
      <>
        <span className="mr-auto self-center text-[13px] text-muted">Delete this document?</span>
        <Button variant="ghost" onClick={() => setArmed(false)}>
          Cancel
        </Button>
        <Button
          variant="danger"
          onClick={() => {
            db.remove("docs", doc.id);
            onClose();
            toast(`${doc.title} deleted`, { label: "Undo", run: () => db.insert("docs", doc) });
          }}
        >
          Delete
        </Button>
      </>
    ) : (
      <>
        <Button variant="danger" className="mr-auto" onClick={() => setArmed(true)}>
          Delete
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            setDraft(toDraft(doc));
            setEditing(true);
          }}
        >
          Edit
        </Button>
      </>
    );
  }

  const note = doc && (passportNote(doc, trips) ?? undefined);
  const days = doc?.expires ? daysFrom(doc.expires) : undefined;

  return (
    <Sheet open={!!doc} onClose={onClose} title={doc ? (editing ? "Edit document" : doc.title) : "Document"} footer={footer}>
      {doc && editing && <DocForm draft={draft} set={setDraft} />}
      {doc && !editing && (
        <div className="flex flex-col gap-7">
          <div>
            {doc.expires ? (
              <>
                <Label>{verb(doc.kind)}</Label>
                <p className={cx("mt-1.5 font-serif text-[30px] leading-none tracking-[-0.015em]", soon(doc) ? "text-coral" : "text-ink")}>{left(days!)}</p>
                <p className="mt-2 text-[13px] text-muted">{fullDate.format(parse(doc.expires))}</p>
              </>
            ) : (
              <p className="text-[13.5px] text-muted">No expiry or renewal date.</p>
            )}
            {note && <p className="mt-3 border-l-2 border-warn pl-3 text-[13px] leading-relaxed text-ink">{note}</p>}
          </div>

          <Facts
            items={[
              ["Kind", kindName[doc.kind]],
              ["Holder", doc.holder ?? <span className="text-faint">Not added</span>],
              ["Reference", doc.reference ? <span className="font-mono text-[12.5px]">{doc.reference}</span> : <span className="text-faint">Not added</span>],
              ...(doc.vehicle ? ([["Vehicle", <span className="font-mono text-[12.5px]">{doc.vehicle}</span>]] as [ReactNode, ReactNode][]) : []),
              ["Source", <Source id={doc.source} />],
            ]}
          />

          <Field label="Notes">
            <Textarea value={doc.notes ?? ""} placeholder="Add a note" onChange={(e) => db.patch("docs", doc.id, { notes: e.target.value || undefined })} />
          </Field>

          <Section title="Remind me">
            {doc.expires ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <Segmented label="How far ahead" items={leads} value={lead} onChange={setLead} />
                  <span className="text-[13px] text-muted">before</span>
                  <Button size="sm" onClick={() => addReminder(doc)}>
                    Add reminder
                  </Button>
                </div>
                {reminders.length > 0 && <ul className="mt-3 divide-y divide-line border-y border-line">{reminders.map((t) => <MiniTask key={t.id} task={t} />)}</ul>}
              </>
            ) : (
              <p className="text-[13px] text-muted">Add a date to set a reminder.</p>
            )}
          </Section>

          <Section title="Emails" meta={emails.length ? undefined : "None linked"}>
            {emails.length > 0 && (
              <ul className="divide-y divide-line border-y border-line">
                {emails.map((m) => (
                  <li key={m.id}>
                    <a href={href(`inbox/${m.id}`)} className="flex min-h-11 items-center gap-3 py-2 hover:bg-soft/60">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] text-ink">{m.subject}</span>
                        <span className="block truncate text-[12.5px] text-muted">{m.from.name}</span>
                      </span>
                      <span className="shrink-0 text-[12.5px] tabular-nums text-muted">{stamp(m.date)}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      )}
    </Sheet>
  );
}

/* Page ---------------------------------------------------------------------------------------------- */

export default function AdminPage() {
  const { rest } = useRoute();
  const docs = useDB((d) => d.docs);
  const trips = useDB((d) => d.trips);
  const [adding, setAdding] = useState(false);

  const dated = docs.filter((d) => d.expires).sort((a, b) => (a.expires! < b.expires! ? -1 : 1));
  const groups: { key: string; title: string; meta?: string; docs: Doc[] }[] = [
    { key: "30", title: "Due within 30 days", docs: dated.filter((d) => daysFrom(d.expires!) <= 30) },
    { key: "90", title: "Next 3 months", docs: dated.filter((d) => daysFrom(d.expires!) > 30 && daysFrom(d.expires!) <= 91) },
    { key: "later", title: "Later", docs: dated.filter((d) => daysFrom(d.expires!) > 91) },
    { key: "none", title: "No date", docs: docs.filter((d) => !d.expires) },
  ];
  const car = docs.filter((d) => d.vehicle);

  const first = groups[0].docs[0];
  const others = groups[0].docs.length - 1 + groups[1].docs.length;
  const lede = first
    ? `${first.title.split(" · ")[0]} ${verb(first.kind).toLowerCase()} ${left(daysFrom(first.expires!))}. ${others ? `${others} more in the next three months.` : "Nothing else for three months."}`
    : "Nothing needs renewing in the next month.";

  return (
    <Page
      title="Life admin"
      lede={lede}
      actions={
        <Button variant="primary" onClick={() => setAdding(true)}>
          <Plus size={15} aria-hidden /> Add a document
        </Button>
      }
    >
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-12">
        <div className="flex min-w-0 flex-col gap-9">
          {docs.length === 0 && <Empty title="No documents yet">Add passports, insurance and anything else with a renewal date.</Empty>}
          {groups.map(
            (g) =>
              g.docs.length > 0 && (
                <Section key={g.key} title={g.title} meta={`${g.docs.length}`}>
                  <ul className="divide-y divide-line border-y border-line">
                    {g.docs.map((d) => (
                      <DocRow key={d.id} doc={d} note={passportNote(d, trips)} />
                    ))}
                  </ul>
                </Section>
              ),
          )}
        </div>
        <aside className="flex min-w-0 flex-col gap-9">
          <Car docs={car} />
        </aside>
      </div>

      <DocSheet id={rest[0]} onClose={() => go("admin")} />
      <NewDoc open={adding} onClose={() => setAdding(false)} />
    </Page>
  );
}
