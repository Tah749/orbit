import { useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";
import { List, X } from "@phosphor-icons/react";
import { Logo } from "./ui/Logo";
import { ButtonLink } from "./ui/Button";

const links = [
  { href: "#product", label: "Product" },
  { href: "#features", label: "Features" },
  { href: "#privacy", label: "Privacy" },
  { href: "#faq", label: "FAQ" },
];

export function Navbar({ home = true }: { home?: boolean }) {
  const { scrollY } = useScroll();
  const reduce = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 12));

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const prefix = home ? "" : "#/";
  const solid = scrolled || open;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-[background-color,border-color,backdrop-filter] duration-300 ${
        solid ? "border-b border-line/80 bg-paper/75 backdrop-blur-xl" : "border-b border-transparent"
      }`}
    >
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:rounded-full focus:bg-surface focus:px-4 focus:py-2 focus:text-sm">
        Skip to content
      </a>
      <nav aria-label="Main" className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 sm:px-6">
        <a href={home ? "#top" : "#/"} aria-label="Orbit home" className="rounded-md">
          <Logo />
        </a>
        <ul className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a href={home ? l.href : `${prefix}`} className="rounded-full px-3.5 py-2 text-[14px] text-muted transition-colors hover:text-ink">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2">
          <a href="#/sign-in" className="hidden rounded-full px-3 py-2 text-[14px] text-muted transition-colors hover:text-ink sm:inline-flex">
            Sign in
          </a>
          <ButtonLink href={home ? "#join" : "#/"} size="sm" className={open ? "invisible" : ""}>
            Join the waitlist
          </ButtonLink>
          <button
            type="button"
            className="grid size-10 place-items-center rounded-full text-ink md:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X size={20} /> : <List size={20} />}
          </button>
        </div>
      </nav>
      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={reduce ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="border-t border-line px-4 pb-6 pt-2 md:hidden"
          >
            <ul className="flex flex-col">
              {links.map((l) => (
                <li key={l.href}>
                  <a
                    href={home ? l.href : "#/"}
                    onClick={() => setOpen(false)}
                    className="block border-b border-line/60 py-3.5 text-[17px] text-ink"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-col gap-2">
              <ButtonLink href={home ? "#join" : "#/"} onClick={() => setOpen(false)} size="lg">
                Join the waitlist
              </ButtonLink>
              <a href="#/sign-in" onClick={() => setOpen(false)} className="py-2 text-center text-[15px] text-muted">
                Sign in
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
