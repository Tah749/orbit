import { ArrowLeft } from "@phosphor-icons/react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

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
  "sign-in": {
    title: "Sign in",
    body: ["Orbit isn't open yet, so there's nothing to sign in to. Join the waitlist and we'll let you know when early access is ready."],
  },
};

export function PlaceholderPage({ slug }: { slug: string }) {
  const page = pages[slug] ?? { title: "Page not found", body: ["We couldn't find that page."] };
  return (
    <>
      <Navbar home={false} />
      <main id="main" className="relative isolate min-h-[70dvh] pt-32">
        <div aria-hidden="true" className="glow-top pointer-events-none absolute inset-x-0 top-0 -z-10 h-[500px]" />
        <article className="mx-auto max-w-[680px] px-4 pb-24 sm:px-6">
          <a href="#/" className="inline-flex items-center gap-1.5 text-[14px] text-muted hover:text-ink">
            <ArrowLeft size={14} /> Back to Orbit
          </a>
          <h1 className="mt-6 text-[40px] font-semibold tracking-[-0.04em] text-ink">{page.title}</h1>
          <div className="mt-6 flex flex-col gap-4 text-[16px] leading-relaxed text-muted">
            {page.body.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </article>
      </main>
      <Footer home={false} />
    </>
  );
}
