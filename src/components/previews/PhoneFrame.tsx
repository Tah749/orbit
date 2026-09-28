import { House, Tray, Sparkle, CalendarBlank, DotsNine } from "@phosphor-icons/react";
import type { ReactNode } from "react";

const tabs = [
  { icon: House, label: "Home" },
  { icon: Tray, label: "Inbox" },
  { icon: Sparkle, label: "Assistant" },
  { icon: CalendarBlank, label: "Calendar" },
  { icon: DotsNine, label: "More" },
];

/** Minimal phone shell matching the Orbit mobile app. */
export function PhoneFrame({ children, active = 0, label }: { children: ReactNode; active?: number; label: string }) {
  return (
    <figure
      role="img"
      aria-label={label}
      className="mx-auto w-full max-w-[340px] overflow-hidden rounded-[36px] border border-line bg-paper p-1.5 shadow-[0_50px_100px_-40px_rgba(124,77,255,0.45)]"
    >
      <div aria-hidden="true" className="flex flex-col overflow-hidden rounded-[30px] border border-[#1d1a26] bg-[#0d0c12]">
        <div className="flex items-center justify-between px-6 pb-1 pt-3 font-mono text-[11px] text-ink">
          <span>9:41</span>
          <span className="h-[18px] w-20 rounded-full bg-black/70" />
          <span className="text-muted">Demo</span>
        </div>
        <div className="flex flex-col gap-3 px-4 pb-4 pt-3">{children}</div>
        <nav className="grid grid-cols-5 border-t border-line bg-paper px-2 pb-3 pt-2">
          {tabs.map(({ icon: I, label: l }, i) => (
            <span key={l} className={`flex flex-col items-center gap-0.5 text-[9.5px] ${i === active ? "text-accent" : "text-muted"}`}>
              <I size={17} weight={i === active ? "fill" : "regular"} />
              {l}
            </span>
          ))}
        </nav>
      </div>
    </figure>
  );
}
