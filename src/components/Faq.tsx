import { Plus } from "@phosphor-icons/react";
import { Reveal } from "./ui/Reveal";

const faqs = [
  {
    q: "What is Orbit?",
    a: "Orbit is an AI assistant that brings your email, calendar, bills, bookings, investments, fitness and tasks into one place, so you can see what matters and act on it.",
  },
  {
    q: "When can I start using it?",
    a: "Orbit is in development. Join the waitlist and we'll email you when early access is ready. We won't send anything else without asking.",
  },
  {
    q: "Which services will Orbit connect to?",
    a: "We're starting with email and calendar, then banking, investments, travel and fitness. The integrations section shows the current status of each.",
  },
  {
    q: "Can Orbit act on my behalf?",
    a: "Orbit can suggest actions, like drafting a reply or adding a reminder. Important actions wait for your approval, and Orbit won't make payments.",
  },
  {
    q: "How will my data be handled?",
    a: "You choose what to connect and can disconnect at any time. We'll publish detailed information on security and data handling before early access.",
  },
  {
    q: "How much will it cost?",
    a: "Pricing hasn't been decided yet. People on the waitlist will hear about it first.",
  },
];

export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="py-24 md:py-32">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-4 sm:px-6 md:grid-cols-12">
        <Reveal className="md:col-span-4">
          <h2 id="faq-title" className="text-[34px] font-semibold leading-[1.08] tracking-[-0.035em] text-ink md:text-[44px]">
            Questions, answered.
          </h2>
        </Reveal>
        <div className="flex flex-col gap-2 md:col-span-8">
          {faqs.map((f, i) => (
            <Reveal key={f.q} delay={i * 0.04}>
              <details className="group rounded-2xl border border-line bg-surface transition-colors open:border-[#433d52] hover:border-[#433d52]">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-2xl px-5 py-4 text-[16px] font-medium text-ink [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <Plus size={16} className="shrink-0 text-muted transition-transform duration-300 group-open:rotate-45 group-open:text-accent" />
                </summary>
                <p className="max-w-[62ch] px-5 pb-5 text-[15px] leading-relaxed text-muted">{f.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
