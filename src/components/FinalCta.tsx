import { Orb } from "./ui/Logo";
import { Reveal } from "./ui/Reveal";
import { WaitlistForm } from "./WaitlistForm";

export function FinalCta() {
  return (
    <section id="join" aria-labelledby="join-title" className="relative isolate overflow-hidden py-28 md:py-40">
      <div aria-hidden="true" className="glow-cta pointer-events-none absolute inset-0 -z-10" />
      <div className="mx-auto flex max-w-[640px] flex-col items-center px-4 text-center sm:px-6">
        <Reveal className="flex flex-col items-center">
          <Orb className="size-14 shadow-[0_0_80px_-10px_color-mix(in_srgb,var(--green)_55%,transparent)]" />
          <h2 id="join-title" className="mt-8 text-balance text-[40px] font-semibold leading-[1.04] tracking-[-0.045em] text-ink md:text-[60px]">
            Your life, connected.
            <br />
            <span className="text-muted">Get there first.</span>
          </h2>
          <p className="mt-5 max-w-[46ch] text-[16px] leading-relaxed text-muted md:text-[17px]">
            Join the Orbit waitlist and be among the first to experience a more connected way to manage your life.
          </p>
        </Reveal>
        <Reveal delay={0.1} className="mt-9 w-full max-w-[30rem]">
          <WaitlistForm source="footer-cta" size="lg" />
          <p className="text-[13px] text-muted">Be the first to hear about early access and product updates.</p>
        </Reveal>
      </div>
    </section>
  );
}
