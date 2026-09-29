import { Suspense, lazy, useEffect, useRef, useState, type FormEvent } from "react";
import { Orb } from "./ui/Logo";
import { Button, Input, Field } from "../orbit/ui";

const OrbitApp = lazy(() => import("../orbit/App"));

// A casual gate on a static site to keep the preview private, not security.
const HASH = "e591c0d6b692c39730ba3c00c9bde281a86a13dd5629bcf1ffb8f42402be1523";
const KEY = "orbit.unlock";

function unlocked() {
  try {
    return sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

async function sha256(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

function AppFallback() {
  return (
    <div className="grid min-h-[100dvh] place-items-center bg-paper">
      <span role="status" aria-label="Loading Orbit" className="text-ink">
        <Orb className="size-10 animate-pulse" />
      </span>
    </div>
  );
}

export function AppGate() {
  const [open, setOpen] = useState(unlocked);
  const [wrong, setWrong] = useState(false);
  const [busy, setBusy] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const field = () => form.current?.elements.namedItem("password") as HTMLInputElement | null;

  useEffect(() => {
    if (open) return;
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex";
    document.head.appendChild(meta);
    return () => meta.remove();
  }, [open]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    let ok = false;
    try {
      ok = (await sha256(field()?.value ?? "")) === HASH;
    } catch {
      ok = false;
    }
    setBusy(false);
    if (ok) {
      try {
        sessionStorage.setItem(KEY, "1");
      } catch {
        /* the app still opens for this visit */
      }
      setOpen(true);
    } else {
      setWrong(true);
      field()?.focus();
      field()?.select();
    }
  }

  if (open) {
    return (
      <Suspense fallback={<AppFallback />}>
        <OrbitApp />
      </Suspense>
    );
  }

  return (
    <main className="grid min-h-[100dvh] place-items-center bg-paper px-4">
      <div className="w-full max-w-[320px]">
        <Orb className="size-8 text-ink" />
        <h1 className="mt-8 font-serif text-[34px] font-normal tracking-[-0.02em] text-ink">Private preview</h1>
        <p className="mt-2 text-[14px] text-muted">Enter the password to open the Orbit app.</p>
        <form ref={form} onSubmit={submit} className="mt-8 flex flex-col gap-4">
          <Field label="Password">
            <Input
              name="password"
              type="password"
              autoComplete="current-password"
              autoFocus
              required
              aria-invalid={wrong || undefined}
              onChange={() => wrong && setWrong(false)}
            />
          </Field>
          {wrong && (
            <p role="alert" className="text-[13px] text-coral">
              That password isn't right.
            </p>
          )}
          <Button type="submit" variant="primary" disabled={busy} className="h-10">
            Unlock
          </Button>
        </form>
      </div>
    </main>
  );
}

export default AppGate;
