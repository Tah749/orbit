import {
  SunHorizon,
  Tray,
  AirplaneTakeoff,
  Receipt,
  EnvelopeSimple,
  BookmarkSimple,
  ArrowsClockwise,
  Lightning,
  Warning,
} from "@phosphor-icons/react";
import { Orb } from "../ui/Logo";
import { IconTile, Panel, PanelTitle, Pill, PreviewFrame } from "./primitives";

export function TodayPreview() {
  return (
    <PreviewFrame
      icon={SunHorizon}
      title="Good morning, Alex."
      subtitle="Tuesday 14 October"
      label="Orbit daily briefing preview with demo data: today's schedule, three priorities, an upcoming flight, a bill due soon and suggested next actions."
    >
      <Panel className="p-3.5">
        <div className="mb-2 flex items-center gap-2">
          <Orb className="size-3.5" />
          <span className="text-[11.5px] font-medium text-accent-fg">Briefing</span>
          <Pill tone="solid" className="ml-auto">Today</Pill>
        </div>
        <p className="text-[13px] leading-relaxed text-ink">
          A lighter day than usual. Your stand-up is at 09:30, the project review moved to 15:00, and you fly to
          Edinburgh tomorrow afternoon.
        </p>
      </Panel>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Panel className="flex flex-col gap-2.5 p-3.5">
          <PanelTitle>Schedule</PanelTitle>
          {[
            ["09:30", "Team stand-up"],
            ["12:30", "Lunch with Tomás"],
            ["15:00", "Q4 project review"],
          ].map(([t, e]) => (
            <div key={e} className="flex gap-3 text-[12px]">
              <span className="w-10 font-mono text-muted">{t}</span>
              <span className="truncate text-ink">{e}</span>
            </div>
          ))}
        </Panel>
        <Panel className="flex flex-col gap-2.5 p-3.5">
          <PanelTitle>Priorities</PanelTitle>
          {["Send numbers to Priya", "Renew car insurance", "Pack for Edinburgh"].map((p, i) => (
            <div key={p} className="flex items-center gap-2.5 text-[12px]">
              <span className="grid size-4 place-items-center rounded-full bg-accent-bg font-mono text-[9.5px] text-accent-fg">{i + 1}</span>
              <span className="truncate text-ink">{p}</span>
            </div>
          ))}
        </Panel>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Panel className="flex items-center gap-3 p-3.5">
          <IconTile icon={AirplaneTakeoff} tone="violet" />
          <div className="min-w-0">
            <p className="truncate text-[12px] text-ink">LHR to EDI</p>
            <p className="text-[11px] text-muted">Tomorrow, 16:20</p>
          </div>
        </Panel>
        <Panel className="flex items-center gap-3 p-3.5">
          <IconTile icon={Receipt} tone="amber" />
          <div className="min-w-0">
            <p className="truncate text-[12px] text-ink">Electricity £68.32</p>
            <p className="text-[11px] text-muted">Due Friday</p>
          </div>
        </Panel>
      </div>
      <div className="flex flex-wrap gap-2">
        {["Draft reply to Priya", "Set a packing reminder"].map((a) => (
          <span key={a} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-soft px-3 py-1.5 text-[11.5px] text-ink">
            <Lightning size={12} weight="fill" className="text-accent" />
            {a}
          </span>
        ))}
      </div>
    </PreviewFrame>
  );
}

const inbox = [
  { icon: AirplaneTakeoff, tone: "violet" as const, title: "Flight to Edinburgh tomorrow", preview: "BZ 1452 · 16:20 · Terminal 5. Online check-in is open.", source: "Brisa Air via Email", date: "Today", priority: "High" },
  { icon: Receipt, tone: "amber" as const, title: "Electricity bill due in 3 days", preview: "£68.32 from Northgrid Energy, due 17 Oct.", source: "Bills", date: "Today", priority: "Due soon" },
  { icon: EnvelopeSimple, tone: "rose" as const, title: "Priya is waiting for a reply", preview: "\"Could you send the final numbers before Thursday?\"", source: "Email", date: "08:42", priority: "Reply" },
  { icon: BookmarkSimple, tone: "neutral" as const, title: "Table for two confirmed", preview: "Saturday 19:30 at Olmo, Marylebone. Ref OL-2281.", source: "Bookings", date: "Yest" },
  { icon: ArrowsClockwise, tone: "neutral" as const, title: "Cloud storage renews Monday", preview: "£7.99 monthly plan renews on 20 Oct.", source: "Subscriptions", date: "Mon" },
];

export function InboxPreview() {
  return (
    <PreviewFrame
      icon={Tray}
      title="Life Inbox"
      subtitle="The things that need your attention"
      label="Orbit Life Inbox preview with demo data: filter chips and items for a flight confirmation, an electricity bill, an email awaiting reply, a restaurant booking and a subscription renewal."
    >
      <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
        {["All", "Important", "Travel", "Bills", "Personal"].map((c, i) => (
          <span
            key={c}
            className={`whitespace-nowrap rounded-full px-3 py-1 text-[11.5px] ${i === 0 ? "bg-accent font-medium text-paper" : "border border-line text-muted"}`}
          >
            {c}
          </span>
        ))}
      </div>
      <ul className="flex flex-col gap-2">
        {inbox.map((it) => (
          <li key={it.title}>
            <Panel className="flex items-start gap-3 p-3">
              <IconTile icon={it.icon} tone={it.tone} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-[12.5px] font-medium text-ink">{it.title}</p>
                  {it.priority && (
                    <Pill tone={it.priority === "High" ? "coral" : it.priority === "Due soon" ? "amber" : "rose"} className="shrink-0">
                      {it.priority === "High" && <Warning size={10} className="mr-0.5" />}
                      {it.priority}
                    </Pill>
                  )}
                </div>
                <p className="truncate text-[11.5px] text-muted">{it.preview}</p>
                <p className="mt-1 text-[10.5px] text-[#7d7690]">{it.source}</p>
              </div>
              <span className="shrink-0 font-mono text-[10.5px] text-muted">{it.date}</span>
            </Panel>
          </li>
        ))}
      </ul>
    </PreviewFrame>
  );
}
