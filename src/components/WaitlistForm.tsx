import { useId, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { WarningCircle, CircleNotch } from "@phosphor-icons/react";
import { Button } from "./ui/Button";
import { isWaitlistConfigured, submitWaitlist, validateEmail } from "../lib/waitlist";

const interests = ["Email", "Calendar", "Bills", "Travel", "Investments", "Fitness", "Tasks"];

type Stage = "email" | "details" | "loading" | "success" | "duplicate";

/**
 * Two-step waitlist form: email first, then optional details, then one insert.
 * Spam protection: a hidden honeypot field and a minimum time on the form.
 */
export function WaitlistForm({ source }: { source: string }) {
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
    "h-10 w-full rounded-[7px] border border-line bg-surface px-3 text-[14px] text-ink placeholder:text-faint transition-colors hover:border-line-strong focus:border-accent focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent";

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
                className={`${inputCls} ${error ? "border-coral" : ""}`}
              />
              <Button type="submit" className="shrink-0">
                Join the waitlist
              </Button>
            </div>
            {/* Honeypot: hidden from people and assistive tech. */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
              <label>
                Company
                <input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
              </label>
            </div>
            <p id={ids.err} role="alert" className="min-h-5 text-left text-[13px] text-coral">
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
            className="flex flex-col gap-4 rounded-[10px] border border-line bg-surface p-5 text-left"
            aria-busy={stage === "loading"}
          >
            <div>
              <p className="font-serif text-[22px] leading-tight tracking-[-0.01em] text-ink">Almost there</p>
              <p className="mt-1 text-[13.5px] text-muted">
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
                className={inputCls}
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
                      className={`h-8 rounded-[7px] border px-3 text-[13px] transition-colors ${
                        on ? "border-accent bg-accent-bg text-accent-fg" : "border-line bg-surface text-muted hover:border-line-strong hover:text-ink"
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
                className="h-10 rounded-[7px] text-left text-[13.5px] text-muted hover:text-ink"
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
                    "Join the waitlist"
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
            className="flex flex-col gap-2 rounded-[10px] border border-line bg-surface p-5 text-left"
          >
            <p className="font-serif text-[24px] leading-tight tracking-[-0.02em] text-ink">
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
        <p className="mt-3 text-[12px] text-warn">
          Development mode: Supabase is not configured, so this signup was not saved.
        </p>
      )}
    </div>
  );
}
