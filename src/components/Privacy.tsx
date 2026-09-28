import { LockSimple, ShieldCheck, CheckCircle, ArrowRight } from "@phosphor-icons/react";
import { Reveal } from "./ui/Reveal";

const principles = [
  { icon: LockSimple, title: "You stay in control", body: "Choose which services to connect and what information Orbit can access." },
  { icon: ShieldCheck, title: "Your data stays yours", body: "Clear controls for managing connected accounts and personal information." },
  { icon: CheckCircle, title: "Actions require your say-so", body: "Review important actions before Orbit carries them out." },
];

export function Privacy() {
  return (
    <section id="privacy" aria-labelledby="privacy-title" className="relative border-y border-line/70 bg-deep py-24 md:py-32">
      <div className="mx-auto grid max-w-[1200px] gap-12 px-4 sm:px-6 md:grid-cols-12 md:gap-10">
        <Reveal className="flex flex-col gap-5 md:col-span-5 md:sticky md:top-28 md:self-start">
          <h2 id="privacy-title" className="text-balance text-[34px] font-semibold leading-[1.08] tracking-[-0.035em] text-ink md:text-[44px]">
            Your life is personal. Orbit should respect that.
          </h2>
          <p className="max-w-[44ch] text-[16px] leading-relaxed text-muted md:text-[17px]">
            Orbit is being designed around privacy, transparency and user control.
          </p>
          <a href="#/privacy" className="inline-flex w-fit items-center gap-1.5 text-[14.5px] font-medium text-accent-fg transition-colors hover:text-ink">
            Read our Privacy Policy <ArrowRight size={14} />
          </a>
        </Reveal>

        <ul className="flex flex-col md:col-span-6 md:col-start-7">
          {principles.map(({ icon: I, title, body }, i) => (
            <Reveal as="li" key={title} delay={i * 0.08} className="group flex gap-5 border-b border-line py-7 first:pt-0 last:border-b-0">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-line bg-surface text-accent transition-colors group-hover:border-accent/40 group-hover:bg-accent-bg">
                <I size={22} />
              </span>
              <div>
                <h3 className="text-[19px] font-medium tracking-[-0.02em] text-ink">{title}</h3>
                <p className="mt-1.5 max-w-[46ch] text-[15px] leading-relaxed text-muted">{body}</p>
              </div>
            </Reveal>
          ))}
          <Reveal as="li" className="pt-2 text-[13px] leading-relaxed text-muted">
            These are the principles Orbit is being built on. They are design commitments, not certifications. We'll
            publish full details on security and data handling before early access opens.
          </Reveal>
        </ul>
      </div>
    </section>
  );
}
