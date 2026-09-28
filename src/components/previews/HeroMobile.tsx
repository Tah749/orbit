import { EnvelopeSimple, AirplaneTilt, Receipt, Microphone, CaretRight } from "@phosphor-icons/react";
import { Orb } from "../ui/Logo";
import { IconTile, Panel } from "./primitives";
import { PhoneFrame } from "./PhoneFrame";

const priorities = [
  { icon: EnvelopeSimple, title: "Reply to Priya", meta: "Due today · Email", tone: "rose" as const },
  { icon: AirplaneTilt, title: "Flight to Edinburgh", meta: "Tomorrow 16:20 · BZ 1452", tone: "violet" as const },
  { icon: Receipt, title: "Electricity bill", meta: "£68.32 · Due Friday", tone: "amber" as const },
];

/** Recomposed hero preview for small screens: the Orbit mobile home. */
export function HeroMobile() {
  return (
    <PhoneFrame label="Preview of the Orbit mobile home screen with illustrative demo data: a daily briefing and three priorities for today.">
      <div className="flex items-center gap-2">
        <Orb className="size-6" />
        <div>
          <p className="text-[15px] font-medium leading-tight">Orbit</p>
          <p className="text-[10px] text-accent-fg">Tuesday 14 October</p>
        </div>
      </div>
      <Panel className="p-3.5">
        <p className="text-[14px] font-medium">Good morning, Alex</p>
        <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
          Three things need you today and one bill is due this week. You have a free hour after lunch.
        </p>
      </Panel>
      <Panel className="flex flex-col gap-2.5 p-3.5">
        <p className="text-[11.5px] font-medium text-ink">Today's priorities</p>
        {priorities.map((p) => (
          <div key={p.title} className="flex items-center gap-2.5">
            <IconTile icon={p.icon} tone={p.tone} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] text-ink">{p.title}</p>
              <p className="truncate text-[10.5px] text-muted">{p.meta}</p>
            </div>
            <CaretRight size={12} className="text-muted" />
          </div>
        ))}
      </Panel>
      <div className="flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-2.5">
        <span className="flex-1 text-[11.5px] text-muted">Ask me anything...</span>
        <Microphone size={15} className="text-accent" />
      </div>
    </PhoneFrame>
  );
}
