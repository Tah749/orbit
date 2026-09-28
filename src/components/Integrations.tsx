import { integrations, type IntegrationStatus } from "../data/integrations";
import { Reveal } from "./ui/Reveal";
import { SectionHeading } from "./ui/Section";

const statusCls: Record<IntegrationStatus, string> = {
  "In development": "bg-accent-bg text-accent-fg",
  "Coming soon": "bg-[#1f1936] text-info",
  Planned: "bg-soft text-muted",
};

export function Integrations() {
  return (
    <section aria-labelledby="integrations-title" className="py-24 md:py-32">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <SectionHeading
          id="integrations-title"
          title="Your apps. Working together."
          body="Orbit is designed to bring the services you already use into one connected experience."
        />
        <ul className="mt-14 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {integrations.map(({ name, detail, icon: I, status }, i) => (
            <Reveal
              as="li"
              key={name}
              delay={(i % 4) * 0.05}
              className="group flex flex-col gap-6 rounded-3xl border border-line bg-surface p-5 transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-[#433d52] md:p-6"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="grid size-11 place-items-center rounded-2xl bg-soft text-ink transition-colors group-hover:text-accent">
                  <I size={22} />
                </span>
                <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium ${statusCls[status]}`}>{status}</span>
              </div>
              <div>
                <p className="text-[15.5px] font-medium text-ink">{name}</p>
                <p className="text-[13px] text-muted">{detail}</p>
              </div>
            </Reveal>
          ))}
        </ul>
        <p className="mt-6 text-center text-[13px] text-muted">
          No integrations are live yet. Product names are used to describe planned connections and do not imply
          endorsement or affiliation.
        </p>
      </div>
    </section>
  );
}
