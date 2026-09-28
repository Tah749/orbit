import { EnvelopeSimple, CalendarBlank, Bank, AirplaneTilt, Notepad, Heartbeat, ChatCircle, Receipt, Bell, Stack, Brain, PuzzlePiece } from "@phosphor-icons/react";
import { Reveal } from "./ui/Reveal";
import { SectionHeading } from "./ui/Section";

const scattered = [
  { icon: EnvelopeSimple, label: "Email", x: "8%", y: "14%", r: -6 },
  { icon: CalendarBlank, label: "Calendar", x: "56%", y: "6%", r: 4 },
  { icon: Bank, label: "Banking app", x: "30%", y: "40%", r: -2 },
  { icon: AirplaneTilt, label: "Airline app", x: "60%", y: "44%", r: 7 },
  { icon: Notepad, label: "Notes", x: "4%", y: "66%", r: 5 },
  { icon: Heartbeat, label: "Fitness", x: "44%", y: "74%", r: -5 },
  { icon: ChatCircle, label: "Messages", x: "64%", y: "82%", r: -3 },
];

export function Problem() {
  return (
    <section aria-labelledby="problem-title" className="relative py-24 md:py-32">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <SectionHeading
          id="problem-title"
          eyebrow="Your life is everywhere"
          title="Everything matters. Nothing is connected."
          body="Your life is scattered across apps. Orbit brings the important things together, so you can spend less time keeping track and more time getting on with life."
        />

        <div className="mt-14 grid gap-4 md:grid-cols-5 md:grid-rows-2">
          <Reveal className="group relative flex flex-col overflow-hidden rounded-3xl border border-line bg-surface p-7 transition-colors hover:border-line-strong md:col-span-3 md:row-span-2">
            <div aria-hidden="true" className="relative h-56 md:h-auto md:min-h-72 md:flex-1">
              {scattered.map(({ icon: I, label, x, y, r }) => (
                <span
                  key={label}
                  className="absolute inline-flex items-center gap-2 whitespace-nowrap rounded-xl border border-line bg-soft px-3 py-2 text-[12.5px] text-muted shadow-[0_12px_30px_-12px_var(--shade)] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:rotate-0"
                  style={{ left: x, top: y, rotate: `${r}deg` }}
                >
                  <I size={15} className="text-accent-fg" />
                  {label}
                </span>
              ))}
            </div>
            <div className="mt-6 flex items-start gap-3">
              <Stack size={22} className="mt-0.5 shrink-0 text-accent" />
              <div>
                <h3 className="text-[19px] font-medium tracking-[-0.02em] text-ink">Too many places</h3>
                <p className="mt-1.5 max-w-[46ch] text-[15px] leading-relaxed text-muted">
                  Your plans, conversations, payments and bookings are spread across different apps.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.08} className="group relative overflow-hidden rounded-3xl border border-line bg-surface p-7 transition-colors hover:border-line-strong md:col-span-2">
            <div aria-hidden="true" className="mb-6 flex flex-col gap-1.5">
              {[
                { i: Bell, t: "3 new notifications" },
                { i: Receipt, t: "Your statement is ready" },
              ].map(({ i: I, t }, n) => (
                <span
                  key={t}
                  className="flex items-center gap-2 rounded-xl border border-line bg-soft px-3 py-2 text-[12px] text-muted transition-transform duration-500 group-hover:translate-x-1"
                  style={{ marginLeft: n * 14, opacity: 1 - n * 0.35 }}
                >
                  <I size={14} className="text-accent-fg" /> {t}
                </span>
              ))}
            </div>
            <Brain size={22} className="text-accent" />
            <h3 className="mt-3 text-[19px] font-medium tracking-[-0.02em] text-ink">Too much to remember</h3>
            <p className="mt-1.5 text-[15px] leading-relaxed text-muted">
              Important details get buried in emails, notifications and endless to-do lists.
            </p>
          </Reveal>

          <Reveal delay={0.16} className="relative flex flex-col justify-end overflow-hidden rounded-3xl border border-accent/25 bg-[linear-gradient(160deg,var(--sage)_0%,var(--white)_70%)] p-7 md:col-span-2">
            <div aria-hidden="true" className="mb-6 flex items-center gap-2 text-[12px] text-accent-fg/80">
              <span className="rounded-lg border border-accent/25 px-2.5 py-1.5">07:00</span>
              <span className="h-px flex-1 bg-accent/25" />
              <span className="rounded-lg border border-accent/25 px-2.5 py-1.5">Check 6 apps</span>
            </div>
            <PuzzlePiece size={22} className="text-accent" />
            <h3 className="mt-3 text-[19px] font-medium tracking-[-0.02em] text-ink">Too much to manage</h3>
            <p className="mt-1.5 text-[15px] leading-relaxed text-muted">
              You shouldn't have to piece together your own life every morning.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
