import { useId, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, WarningCircle, CircleNotch } from "@phosphor-icons/react";
import { Button } from "./ui/Button";
import { isWaitlistConfigured, submitWaitlist, validateEmail } from "../lib/waitlist";

const interests = ["Email", "Calendar", "Bills", "Travel", "Investments", "Fitness", "Tasks"];

type Stage = "email" | "details" | "loading" | "success" | "duplicate";

/**
 * Two-step waitlist form: email first, then optional details, then one insert.
 * Spam protection: a hidden honeypot field and a minimum time on the form.
 */
export function WaitlistForm({ source, size = "md" }: { source: string; size?: "md" | "lg" }) {
  const uid = useId();
  const reduce = useReducedMotion();
  const [stage, setStage] = useState<Stage>("email");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [honeypot, setHoneypot] = useState("");
  const [error, setError] = useState<string | null>(null);
  const openedAt = useRef(Date.now());
  const emailRef = useRef<HTMLInputElement>(null);

  const ids = { email: `${uid}-email`, err: `${uid}-err`, name: `${uid}-name`, help: `${uid}-help` };

  function onEmailStep(e: FormEvent) {
    e.preventDefault();
    const msg = validateEmail(email);
    setError(msg);
    if (msg) {
      emailRef.current?.focus();
      return;
    }
    setStage("details");
  }

  async function finish(skipDetails = false) {
    // Bots fill hidden fields and submit instantly. Pretend success and send nothing.
    if (honeypot || Date.now() - openedAt.current < 2500) {
      setStage("success");
      return;
    }
    setStage("loading");
    setError(null);
    const res = await submitWaitlist({
      email,
      firstName: skipDetails ? undefined : firstName,
      interest: skipDetails ? undefined : picked.join(", "),
      source,
    });
    if (res.status === "success") setStage("success");
    else if (res.status === "duplicate") setStage("duplicate");
    else {
      setStage("details");
      setError("Something went wrong on our side. Please try again in a moment.");
    }
  }

  const fade = reduce
    ? {}
    : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 }, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const } };

  const inputCls =
    "w-full rounded-full border border-line bg-soft px-5 text-[15px] text-ink placeholder:text-faint transition-colors hover:border-line-strong focus:border-accent focus:outline-none focus-visible:outline-none focus:ring-2 focus:ring-accent/30";

  return (
    <div className="w-full">
      <AnimatePresence mode="wait" initial={false}>
        {stage === "email" && (
          <motion.form key="email" {...fade} onSubmit={onEmailStep} noValidate className="flex flex-col gap-2">
            <label htmlFor={ids.email} className="sr-only">
              Email address
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                ref={emailRef}
                id={ids.email}
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(null);
                }}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? ids.err : undefined}
                className={`${inputCls} ${size === "lg" ? "h-12" : "h-11"} ${error ? "border-coral" : ""}`}
              />
              <Button type="submit" size={size === "lg" ? "lg" : "md"} className="shrink-0">
                Join the waitlist <ArrowRight size={16} weight="bold" />
              </Button>
            </div>
            {/* Honeypot: hidden from people and assistive tech. */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
              <label>
                Company
                <input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
              </label>
            </div>
            <p id={ids.err} role="alert" className="min-h-5 px-5 text-left text-[13px] text-coral">
              {error && (
                <span className="inline-flex items-center gap-1.5">
                  <WarningCircle size={14} /> {error}
                </span>
              )}
            </p>
          </motion.form>
        )}

        {(stage === "details" || stage === "loading") && (
          <motion.form
            key="details"
            {...fade}
            onSubmit={(e) => {
              e.preventDefault();
              finish();
            }}
            className="flex flex-col gap-4 rounded-3xl border border-line bg-surface p-5 text-left sm:p-6"
            aria-busy={stage === "loading"}
          >
            <div>
              <p className="text-[16px] font-medium text-ink">Almost there</p>
              <p className="text-[13.5px] text-muted">
                Two optional questions for <span className="text-ink">{email.trim().toLowerCase()}</span>. Skip if you like.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor={ids.name} className="text-[13px] font-medium text-ink">
                First name <span className="font-normal text-muted">(optional)</span>
              </label>
              <input
                id={ids.name}
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                maxLength={80}
                className={`${inputCls} h-11 rounded-xl`}
              />
            </div>
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-[13px] font-medium text-ink">
                What would you most like Orbit to help you with? <span className="font-normal text-muted">(optional)</span>
              </legend>
              <div className="flex flex-wrap gap-2">
                {interests.map((i) => {
                  const on = picked.includes(i);
                  return (
                    <button
                      key={i}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setPicked((p) => (on ? p.filter((x) => x !== i) : [...p, i]))}
                      className={`rounded-full border px-3.5 py-1.5 text-[13px] transition-colors ${
                        on ? "border-accent bg-accent-bg text-accent-fg" : "border-line bg-soft text-muted hover:text-ink"
                      }`}
                    >
                      {i}
                    </button>
                  );
                })}
              </div>
            </fieldset>
            {error && (
              <p role="alert" className="flex items-center gap-1.5 text-[13px] text-coral">
                <WarningCircle size={14} /> {error}
              </p>
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setStage("email");
                }}
                className="h-10 text-[13.5px] text-muted hover:text-ink"
              >
                Change email
              </button>
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <Button type="button" variant="secondary" onClick={() => finish(true)} disabled={stage === "loading"}>
                  Skip
                </Button>
                <Button type="submit" disabled={stage === "loading"}>
                  {stage === "loading" ? (
                    <>
                      <CircleNotch size={16} className="animate-spin" /> Joining...
                    </>
                  ) : (
                    <>
                      Join the waitlist <ArrowRight size={16} weight="bold" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.form>
        )}

        {(stage === "success" || stage === "duplicate") && (
          <motion.div
            key="done"
            {...fade}
            role="status"
            aria-live="polite"
            className="flex flex-col items-center gap-3 rounded-3xl border border-line bg-surface p-6 text-center"
          >
            <span className="grid size-12 place-items-center rounded-full bg-accent-bg [animation:pop-in_0.5s_cubic-bezier(0.16,1,0.3,1)_both]">
              <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="var(--green)" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12.5l4.5 4.5L19 7.5" strokeDasharray="24" strokeDashoffset="24" style={{ animation: "draw-check 0.5s 0.25s ease-out forwards" }} />
              </svg>
            </span>
            <p className="text-[20px] font-medium tracking-[-0.02em] text-ink">
              {stage === "success" ? "You're on the list." : "You're already on the list."}
            </p>
            <p className="max-w-[40ch] text-[14px] leading-relaxed text-muted">
              {stage === "success"
                ? "Thanks for your interest in Orbit. We'll be in touch when early access is ready."
                : "Good news: this email is already signed up. We'll be in touch when early access is ready."}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      {!isWaitlistConfigured && stage !== "email" && (
        <p className="mt-3 text-center text-[12px] text-warn">
          Development mode: Supabase is not configured, so this signup was not saved.
        </p>
      )}
    </div>
  );
}
