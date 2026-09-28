/**
 * Waitlist integration layer.
 *
 * The UI only ever calls `submitWaitlist`. When VITE_SUPABASE_URL and
 * VITE_SUPABASE_ANON_KEY are set, signups are inserted into the
 * `waitlist_signups` table through Supabase's REST API using the public anon
 * key (RLS must allow insert only; see README). Without them the site runs in
 * development mode: nothing is stored, and the UI says so.
 */

export type WaitlistPayload = {
  email: string;
  firstName?: string;
  interest?: string;
  source?: string;
};

export type WaitlistResult =
  | { status: "success" }
  | { status: "duplicate" }
  | { status: "error"; message: string };

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isWaitlistConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normaliseEmail(email: string) {
  return email.trim().toLowerCase();
}

export function validateEmail(email: string): string | null {
  const value = normaliseEmail(email);
  if (!value) return "Enter your email address.";
  if (value.length > 254 || !EMAIL_RE.test(value)) return "That email address doesn't look quite right.";
  return null;
}

export async function submitWaitlist(payload: WaitlistPayload): Promise<WaitlistResult> {
  const email = normaliseEmail(payload.email);
  const row = {
    email,
    first_name: payload.firstName?.trim().slice(0, 80) || null,
    interest: payload.interest?.trim().slice(0, 200) || null,
    source: payload.source ?? null,
  };

  if (!isWaitlistConfigured) {
    // Development fallback: simulate latency, store nothing.
    console.info("[waitlist] Supabase is not configured. This signup was NOT saved:", row);
    await new Promise((r) => setTimeout(r, 900));
    if (email.startsWith("taken@")) return { status: "duplicate" };
    if (email.startsWith("fail@")) return { status: "error", message: "Simulated network error." };
    return { status: "success" };
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/waitlist_signups`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        // Do not ask for the row back: anon users cannot (and should not) read the table.
        Prefer: "return=minimal",
      },
      body: JSON.stringify(row),
    });
    if (res.ok) return { status: "success" };
    // 409 = unique violation on email.
    if (res.status === 409) return { status: "duplicate" };
    return { status: "error", message: `Request failed (${res.status}).` };
  } catch {
    return { status: "error", message: "Network error." };
  }
}
