import { useState } from "react";
import { AirplaneTakeoff, Bed, ForkKnife, Train, MapPin, Copy } from "@phosphor-icons/react";
import { IconTile, Pill } from "../../components/previews/primitives";
import { useStore } from "../store";
import { bookings, type Booking } from "../data";
import { Card, Modal, PageHeader, Segmented } from "../ui";

const views = ["Upcoming", "Past", "Saved"] as const;
type View = (typeof views)[number];
const kindIcon = {
  flight: { icon: AirplaneTakeoff, tone: "violet" as const },
  hotel: { icon: Bed, tone: "rose" as const },
  dinner: { icon: ForkKnife, tone: "amber" as const },
  train: { icon: Train, tone: "neutral" as const },
};

export function BookingsScreen() {
  const { toast } = useStore();
  const [view, setView] = useState<View>("Upcoming");
  const [open, setOpen] = useState<Booking | null>(null);
  const [checkedIn, setCheckedIn] = useState(false);
  const list = bookings.filter((b) => b.status === view.toLowerCase());
  const trip = list.filter((b) => b.where.includes("Edinburgh") || b.where.includes("Heathrow"));
  const others = view === "Upcoming" ? list.filter((b) => !trip.includes(b)) : list;

  const Row = ({ b }: { b: Booking }) => (
    <li className="relative flex items-start gap-3">
      <IconTile {...kindIcon[b.kind]} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13.5px]">{b.title}</p>
        <p className="truncate text-[12px] text-muted">{b.when}</p>
        {b.note && <p className="text-[11.5px] text-accent-fg">{b.kind === "flight" && checkedIn ? "Checked in, seat 14A" : b.note}</p>}
      </div>
      <button type="button" onClick={() => setOpen(b)} className="shrink-0 rounded-full border border-line px-3 py-1.5 text-[12px] hover:bg-soft">
        View confirmation
      </button>
    </li>
  );

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Bookings" subtitle="All your trips and reservations in one place." />
      <Segmented items={views} value={view} onChange={setView} label="Booking views" className="w-full sm:w-auto" />

      {view === "Upcoming" && trip.length > 0 && (
        <Card className="flex flex-col gap-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-[17px] font-medium">Edinburgh</h2>
              <p className="text-[12.5px] text-muted">Wed 15 to Fri 17 October · {trip.length} bookings</p>
            </div>
            <Pill tone="violet">In 1 day</Pill>
          </div>
          <ol className="flex flex-col gap-4">{trip.map((b) => <Row key={b.id} b={b} />)}</ol>
          {!checkedIn && (
            <button
              type="button"
              onClick={() => {
                setCheckedIn(true);
                toast("Demo: check-in opened with Brisa Air. Seat 14A.");
              }}
              className="w-fit rounded-full bg-accent px-4 py-2 text-[13px] font-medium text-paper hover:bg-accent-hover"
            >
              Check in for BZ 1452
            </button>
          )}
        </Card>
      )}

      {others.length > 0 && (
        <Card className="flex flex-col gap-4 p-5">
          {view === "Upcoming" && <h2 className="text-[14px] font-medium">Also coming up</h2>}
          <ol className="flex flex-col gap-4">{others.map((b) => <Row key={b.id} b={b} />)}</ol>
        </Card>
      )}

      <Modal open={!!open} onClose={() => setOpen(null)} title={open?.title ?? ""}>
        {open && (
          <>
            <ul className="flex flex-col gap-2 text-[13.5px]">
              <li className="text-muted">{open.when}</li>
              <li className="flex items-center gap-2 text-muted"><MapPin size={15} /> {open.where}</li>
            </ul>
            <div className="flex items-center justify-between rounded-xl bg-soft p-4">
              <div>
                <p className="text-[11.5px] text-muted">Confirmation reference</p>
                <p className="font-mono text-[20px] tracking-wide">{open.ref}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(open.ref).then(() => toast("Reference copied."), () => toast(`Reference: ${open.ref}`));
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-[12px] hover:bg-surface"
              >
                <Copy size={13} /> Copy
              </button>
            </div>
            <p className="text-[12px] text-muted">Found in your email. Orbit keeps a link to the original confirmation.</p>
          </>
        )}
      </Modal>
    </div>
  );
}
