import { useEffect, useMemo, useState } from "react";
import { CaretDown, Copy, Plus } from "@phosphor-icons/react";
import { useDB } from "../../store";
import type { Booking, Trip } from "../../data/plans";
import { go, href, useRoute } from "../../router";
import { Button, cx, Dot, Empty, IconButton, Label, Page, Section, Source } from "../../ui";
import { dayLabel, inDays, on, parse, shortDate, time, ymd } from "../../time";
import { countdown, isPast, joinNames, openTaskFor, prompts, refLine, tripDates, type Prompt } from "./lib";
import { kinds } from "./kinds";
import { Itinerary, StepRow } from "./Itinerary";
import { addReminder, BookingSheet, copyText } from "./BookingSheet";
import { AddBooking } from "./AddBooking";

const byStart = (a: Booking, b: Booking) => a.start.localeCompare(b.start);

function Prompts({ list, onOpen }: { list: Prompt[]; onOpen: (id: string) => void }) {
  const tasks = useDB((d) => d.tasks);
  if (!list.length) return null;
  return (
    <div>
      <Label className="mb-2">Before you go</Label>
      <ul className="divide-y divide-line border-y border-line">
        {list.map((p) => {
          const t = openTaskFor(tasks, p.booking.id, p.task.title);
          return (
            <li key={p.key} className="flex items-start gap-3 py-3">
              <Dot tone="warn" className="mt-[7px]" />
              <button type="button" onClick={() => onOpen(p.booking.id)} className="min-w-0 flex-1 text-left">
                <span className="block text-[13.5px] font-medium text-ink">{p.title}</span>
                <span className="block text-[12.5px] text-muted">{p.detail}</span>
              </button>
              {t ? (
                <a href={href(`tasks/${t.id}`)} className="shrink-0 pt-0.5 text-[12.5px] text-muted underline decoration-line-strong underline-offset-4 hover:text-ink">
                  In tasks
                </a>
              ) : (
                <Button size="sm" onClick={() => addReminder(p.booking, p.task)}>
                  Remind me
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function References({ list }: { list: Booking[] }) {
  // One row per reference: a return flight often shares the outbound's.
  const seen = new Set<string>();
  const rows = list.filter((b) => b.status !== "cancelled" && b.ref && !seen.has(b.ref) && seen.add(b.ref));
  return (
    <div>
      <Label className="mb-2">References</Label>
      <ul className="divide-y divide-line border-y border-line">
        {rows.map((b) => (
          <li key={b.id} className="flex items-center gap-2 py-1.5 pl-1">
            <span className="min-w-0 flex-1 truncate text-[13px] text-muted">{b.kind === "flight" || b.kind === "train" ? `${b.provider}` : b.title}</span>
            <span className="font-mono text-[12.5px] tracking-[0.04em] text-ink">{b.ref}</span>
            <IconButton label={`Copy reference ${b.ref}`} onClick={() => copyText(b.ref, "Reference")} className="size-8">
              <Copy size={15} />
            </IconButton>
          </li>
        ))}
      </ul>
    </div>
  );
}

function NextTrip({ trip, list, onOpen }: { trip: Trip; list: Booking[]; onOpen: (id: string) => void }) {
  const soon = prompts(list);
  return (
    <section id={`trip-${trip.id}`} aria-labelledby="next-trip" className="scroll-mt-20">
      <Label>Next up</Label>
      <h2 id="next-trip" className="mt-2 font-serif text-[30px] font-normal leading-[1.1] tracking-[-0.015em] text-ink md:text-[36px]">
        {countdown(trip)}
      </h2>
      <p className="mt-1.5 text-[13.5px] text-muted">
        {tripDates(trip)} · {joinNames(trip.travellers)}
        <span className="max-sm:hidden"> · {trip.destination}</span>
      </p>

      <div className="mt-7 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-12">
        <div className="grid content-start gap-8 lg:order-2">
          <Prompts list={soon} onOpen={onOpen} />
          <References list={list} />
        </div>
        <Itinerary bookings={list} tripStart={trip.start} onOpen={onOpen} />
      </div>
    </section>
  );
}

function LaterTrip({ trip, list, open, onToggle, onOpen }: { trip: Trip; list: Booking[]; open: boolean; onToggle: () => void; onOpen: (id: string) => void }) {
  const kindsIn = [...new Set(list.map((b) => kinds[b.kind].name.toLowerCase()))];
  const summary = `${list.length} ${list.length === 1 ? "booking" : "bookings"}${kindsIn.length ? `: ${joinNames(kindsIn)}` : ""}`;
  return (
    <li id={`trip-${trip.id}`} className="scroll-mt-20">
      <button type="button" aria-expanded={open} onClick={onToggle} className="flex w-full items-start gap-4 px-1 py-4 text-left transition-colors hover:bg-soft/60">
        <span className="w-[52px] shrink-0 pt-1 font-mono text-[11px] uppercase tracking-[0.1em] text-muted sm:w-[64px]">{shortDate(trip.start)}</span>
        <span className="min-w-0 flex-1">
          <span className="block font-serif text-[22px] leading-tight text-ink">
            {trip.title}
            {trip.note && <span className="text-muted"> · {trip.note}</span>}
          </span>
          <span className="mt-1 block text-[12.5px] text-muted">
            {tripDates(trip)} · {summary}
          </span>
        </span>
        <CaretDown size={16} className={cx("mt-2 shrink-0 text-faint transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="pb-6 pl-1 pt-2 sm:pl-[80px]">
          {list.length ? <Itinerary bookings={list} tripStart={trip.start} onOpen={onOpen} dense /> : <p className="text-[13.5px] text-muted">No bookings in this trip yet.</p>}
        </div>
      )}
    </li>
  );
}

function OtherBookings({ list, onOpen }: { list: Booking[]; onOpen: (id: string) => void }) {
  const groups = useMemo(() => {
    const g: { day: string; items: Booking[] }[] = [];
    for (const b of list) {
      const day = ymd(parse(b.start));
      const x = g.find((y) => y.day === day);
      if (x) x.items.push(b);
      else g.push({ day, items: [b] });
    }
    return g;
  }, [list]);
  if (!list.length) return <p className="border-y border-line py-4 text-[13.5px] text-muted">Nothing else booked. Restaurant and ticket confirmations will show up here.</p>;
  return (
    <div className="border-t border-line">
      {groups.map((g) => (
        <div key={g.day} className="grid border-b border-line sm:grid-cols-[150px_minmax(0,1fr)]">
          <div className="flex items-baseline gap-2 px-1 pb-0 pt-3 sm:block sm:py-3.5">
            <p className="font-serif text-[17px] leading-5 text-ink">{dayLabel(g.day)}</p>
            <p className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted sm:mt-1">{inDays(g.day)}</p>
          </div>
          <ul className="divide-y divide-line">
            {g.items.map((b) => (
              <StepRow key={b.id} step={{ booking: b, time: time(b.start), title: b.title, sub: refLine(b) || kinds[b.kind].name }} onOpen={onOpen} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function Past({ list, trips, onOpen }: { list: Booking[]; trips: Trip[]; onOpen: (id: string) => void }) {
  const [all, setAll] = useState(false);
  const shown = all ? list : list.slice(0, 4);
  return (
    <>
      <ul className="divide-y divide-line border-y border-line">
        {shown.map((b) => {
          const K = kinds[b.kind];
          const trip = trips.find((t) => t.id === b.tripId);
          return (
            <li key={b.id}>
              <button type="button" onClick={() => onOpen(b.id)} className="flex w-full items-center gap-3 px-1 py-3 text-left transition-colors hover:bg-soft/60">
                <span className="w-[52px] shrink-0 font-mono text-[12px] tabular-nums text-faint sm:w-[64px]">{shortDate(b.start)}</span>
                <K.icon size={15} aria-label={K.name} className="shrink-0 text-faint" />
                <span className="min-w-0 flex-1 truncate text-[13.5px] text-muted">
                  {b.title}
                  {trip && <span className="text-faint"> · {trip.title}</span>}
                </span>
                <Source id={b.source} className="max-sm:hidden" />
              </button>
            </li>
          );
        })}
      </ul>
      {list.length > 4 && (
        <Button variant="ghost" size="sm" className="mt-2" onClick={() => setAll(!all)}>
          {all ? "Show fewer" : `Show all ${list.length}`}
        </Button>
      )}
    </>
  );
}

export default function PlansPage() {
  const { rest } = useRoute();
  const bookings = useDB((d) => d.bookings);
  const trips = useDB((d) => d.trips);
  const [adding, setAdding] = useState(false);
  const [expanded, setExpanded] = useState<string[]>([]);

  const today = on(0);
  const upcomingTrips = useMemo(() => trips.filter((t) => t.end >= today).sort((a, b) => a.start.localeCompare(b.start)), [trips, today]);
  const [next, ...later] = upcomingTrips;
  const inTrip = (t: Trip) => bookings.filter((b) => b.tripId === t.id).sort(byStart);
  const upcomingTripIds = new Set(upcomingTrips.map((t) => t.id));
  const other = bookings.filter((b) => !isPast(b) && !(b.tripId && upcomingTripIds.has(b.tripId))).sort(byStart);
  const past = bookings.filter((b) => isPast(b) && !(b.tripId && upcomingTripIds.has(b.tripId))).sort((a, b) => b.start.localeCompare(a.start));

  // Deep links: plans/<bookingId> opens a booking, plans/trip/<tripId> focuses a trip.
  const focusTrip = rest[0] === "trip" ? rest[1] : bookings.find((b) => b.id === rest[0])?.tripId;
  const openId = rest[0] && rest[0] !== "trip" ? rest[0] : undefined;
  useEffect(() => {
    if (!focusTrip) return;
    setExpanded((x) => (x.includes(focusTrip) ? x : [...x, focusTrip]));
    if (rest[0] !== "trip") return;
    const id = window.requestAnimationFrame(() => document.getElementById(`trip-${focusTrip}`)?.scrollIntoView({ block: "start", behavior: "smooth" }));
    return () => window.cancelAnimationFrame(id);
  }, [focusTrip, rest]);

  const open = (id: string) => go(`plans/${id}`);
  const toggle = (id: string) => setExpanded((x) => (x.includes(id) ? x.filter((y) => y !== id) : [...x, id]));
  const missing = openId && !bookings.some((b) => b.id === openId);

  return (
    <Page
      title="Plans"
      lede="Trips and bookings, put together from your confirmation emails."
      actions={
        <Button variant="primary" onClick={() => setAdding(true)}>
          <Plus size={15} weight="bold" />
          Add a booking
        </Button>
      }
    >
      {missing && <p className="mb-6 border-y border-line py-3 text-[13.5px] text-muted">That booking isn't here any more. It may have been removed.</p>}

      <div className="grid gap-14">
        {next ? (
          <NextTrip trip={next} list={inTrip(next)} onOpen={open} />
        ) : (
          <Empty title="No trips coming up" action={<Button onClick={() => setAdding(true)}>Add a booking</Button>}>
            When a flight or hotel confirmation arrives, Orbit puts the trip together here.
          </Empty>
        )}

        <Section title="Other bookings" meta="Not part of a trip">
          <OtherBookings list={other} onOpen={open} />
        </Section>

        {later.length > 0 && (
          <Section title="Later trips">
            <ul className="divide-y divide-line border-y border-line">
              {later.map((t) => (
                <LaterTrip key={t.id} trip={t} list={inTrip(t)} open={expanded.includes(t.id)} onToggle={() => toggle(t.id)} onOpen={open} />
              ))}
            </ul>
          </Section>
        )}

        {past.length > 0 && (
          <Section title="Past" meta={`${past.length} ${past.length === 1 ? "booking" : "bookings"}`}>
            <Past list={past} trips={trips} onOpen={open} />
          </Section>
        )}
      </div>

      <BookingSheet id={openId} onClose={() => go("plans")} />
      <AddBooking open={adding} onClose={() => setAdding(false)} />
    </Page>
  );
}
