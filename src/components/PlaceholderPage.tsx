import { ArrowLeft } from "@phosphor-icons/react";
import { Wordmark } from "./ui/Logo";

const pages: Record<string, { title: string; body: string[] }> = {
  privacy: {
    title: "Privacy Policy",
    body: [
      "This is a placeholder. Orbit's full Privacy Policy will be published before early access opens.",
      "While Orbit is in development, the only personal information we collect is what you choose to give us on the waitlist form: your email address and, optionally, your first name and what you'd like Orbit to help with. We use it only to contact you about Orbit.",
      "To be removed from the waitlist at any time, email hello@orbit.example.",
    ],
  },
  terms: {
    title: "Terms",
    body: ["This is a placeholder. Orbit's Terms of Service will be published before early access opens."],
  },
};

export function PlaceholderPage({ slug }: { slug: string }) {
  const page = pages[slug] ?? { title: "Page not found", body: ["We couldn't find that page."] };
  return (
    <main id="main" className="min-h-[100dvh] bg-paper">
      <div className="mx-auto max-w-[680px] px-4 pb-24 pt-8">
        <a href="#/" aria-label="Orbit home" className="inline-block text-ink">
          <Wordmark />
        </a>
        <a href="#/" className="mt-12 inline-flex items-center gap-1.5 text-[14px] text-muted hover:text-ink">
          <ArrowLeft size={14} /> Back to Orbit
        </a>
        <h1 className="mt-6 font-serif text-[40px] font-normal tracking-[-0.02em] text-ink">{page.title}</h1>
        <div className="mt-6 flex flex-col gap-4 text-[16px] leading-relaxed text-muted">
          {page.body.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      </div>
    </main>
  );
}
