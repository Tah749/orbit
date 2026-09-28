import { useEffect, useRef, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { X, Check as CheckMark } from "@phosphor-icons/react";
import { sourceName, type SourceId } from "../data/sources";

/* ------------------------------------------------------------------------------------------------
 * Orbit app UI kit. Read src/orbit/DESIGN.md before adding to it.
 * ---------------------------------------------------------------------------------------------- */

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

/* Layout ----------------------------------------------------------------------------------------- */

/** A page: small mono eyebrow, serif title, optional actions, then content. */
export function Page({
  eyebrow,
  title,
  lede,
  actions,
  children,
  wide = false,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  lede?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={cx("mx-auto w-full px-4 pb-24 pt-6 sm:px-8 md:pt-10", wide ? "max-w-[1320px]" : "max-w-[1080px]")}>
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4 border-b border-line pb-5">
        <div className="min-w-0">
          {eyebrow && <Label className="mb-2">{eyebrow}</Label>}
          <h1 className="font-serif text-[34px] font-normal leading-[1.05] tracking-[-0.02em] text-ink md:text-[42px]">{title}</h1>
          {lede && <p className="mt-2 max-w-[60ch] text-[14.5px] leading-relaxed text-muted">{lede}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </header>
      <div className="pt-6">{children}</div>
    </div>
  );
}

/** A titled block of content separated by a hairline, not a floating card. */
export function Section({ title, meta, action, children, className }: { title?: ReactNode; meta?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cx("min-w-0", className)}>
      {(title || action) && (
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <div className="flex min-w-0 items-baseline gap-2.5">
            {title && <h2 className="text-[13.5px] font-semibold tracking-[-0.005em] text-ink">{title}</h2>}
            {meta && <span className="truncate text-[12.5px] text-muted">{meta}</span>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/** A bordered surface. Use sparingly: most content sits directly on the page. */
export function Panel({ children, className, as: As = "div" }: { children: ReactNode; className?: string; as?: "div" | "section" | "article" }) {
  return <As className={cx("rounded-[10px] border border-line bg-surface", className)}>{children}</As>;
}

/** Small uppercase mono label: section eyebrows, table headers, metadata keys. */
export function Label({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cx("font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted", className)}>{children}</p>;
}

/** A list with hairline separators. Put <Row>s inside. */
export function List({ children, className }: { children: ReactNode; className?: string }) {
  return <ul className={cx("divide-y divide-line border-y border-line", className)}>{children}</ul>;
}

export function Row({
  children,
  onClick,
  href,
  active,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  active?: boolean;
  className?: string;
}) {
  const cls = cx(
    "flex w-full min-w-0 items-center gap-3 px-1 py-3 text-left transition-colors",
    (onClick || href) && "hover:bg-soft/60 focus-visible:bg-soft/60",
    active && "bg-soft",
    className,
  );
  return (
    <li>
      {href ? (
        <a href={href} className={cls}>
          {children}
        </a>
      ) : onClick ? (
        <button type="button" onClick={onClick} className={cls}>
          {children}
        </button>
      ) : (
        <div className={cls}>{children}</div>
      )}
    </li>
  );
}

/** Key/value pairs, e.g. booking details. */
export function Facts({ items, className }: { items: [ReactNode, ReactNode][]; className?: string }) {
  return (
    <dl className={cx("grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-[13.5px]", className)}>
      {items.map(([k, v], i) => (
        <div key={i} className="contents">
          <dt className="text-muted">{k}</dt>
          <dd className="min-w-0 text-ink">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/* Text and numbers -------------------------------------------------------------------------------- */

const gbp = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });
const gbp0 = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 });

export const money = (n: number, whole = false) => (whole ? gbp0 : gbp).format(n);

/** An amount in tabular figures. Income can be shown in the accent with `signed`. */
export function Amount({ value, signed = false, whole = false, className }: { value: number; signed?: boolean; whole?: boolean; className?: string }) {
  const text = signed && value > 0 ? `+${money(value, whole)}` : money(value, whole);
  return <span className={cx("tabular-nums", signed && value > 0 && "text-accent", className)}>{text.replace("-", "−")}</span>;
}

/** A headline figure with a label and optional note underneath. */
export function Figure({ label, value, note, className }: { label: ReactNode; value: ReactNode; note?: ReactNode; className?: string }) {
  return (
    <div className={cx("min-w-0", className)}>
      <Label>{label}</Label>
      <p className="mt-1.5 text-[26px] font-medium leading-none tracking-[-0.02em] text-ink tabular-nums">{value}</p>
      {note && <p className="mt-1.5 text-[12.5px] text-muted">{note}</p>}
    </div>
  );
}

/** "via Gmail": where something came from. Every surfaced item should carry one. */
export function Source({ id, className }: { id: SourceId; className?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-1.5 whitespace-nowrap font-mono text-[10.5px] uppercase tracking-[0.08em] text-faint", className)}>
      <span aria-hidden className="size-1 rounded-full bg-current" />
      {sourceName[id]}
    </span>
  );
}

export type Tone = "neutral" | "accent" | "info" | "warn" | "coral";
const tones: Record<Tone, string> = {
  neutral: "bg-soft text-muted",
  accent: "bg-accent-bg text-accent-fg",
  info: "bg-tint-info text-info",
  warn: "bg-tint-warn text-warn",
  coral: "bg-tint-coral text-coral",
};

/** A small status tag. Square-ish, not a pill. */
export function Tag({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={cx("inline-flex items-center whitespace-nowrap rounded-[4px] px-1.5 py-[3px] text-[11.5px] font-medium leading-none", tones[tone], className)}>{children}</span>;
}

/** A coloured dot, e.g. a calendar colour. */
export function Dot({ tone = "accent", className }: { tone?: Tone | "ink"; className?: string }) {
  const c = { neutral: "bg-faint", accent: "bg-accent", info: "bg-info", warn: "bg-warn", coral: "bg-coral", ink: "bg-ink" }[tone];
  return <span aria-hidden className={cx("inline-block size-2 shrink-0 rounded-full", c, className)} />;
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="rounded-[4px] border border-line bg-surface px-1.5 py-0.5 font-mono text-[10.5px] text-muted">{children}</kbd>;
}

const avatarTones = ["bg-accent-bg text-accent-fg", "bg-tint-info text-info", "bg-tint-warn text-warn", "bg-tint-coral text-coral", "bg-soft text-ink"];
export function Avatar({ name, size = 32, className }: { name: string; size?: number; className?: string }) {
  const initials = name
    .replace(/\(.*\)/, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const tone = avatarTones[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % avatarTones.length];
  return (
    <span
      aria-hidden
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      className={cx("inline-grid shrink-0 place-items-center rounded-full font-medium", tone, className)}
    >
      {initials}
    </span>
  );
}

/* Controls ---------------------------------------------------------------------------------------- */

type Variant = "primary" | "accent" | "outline" | "ghost" | "danger";
const variants: Record<Variant, string> = {
  primary: "bg-ink text-paper hover:bg-ink/85",
  accent: "bg-accent text-paper hover:bg-accent-hover",
  outline: "border border-line bg-surface text-ink hover:border-line-strong hover:bg-soft/50",
  ghost: "text-muted hover:bg-soft hover:text-ink",
  danger: "border border-line bg-surface text-coral hover:border-coral/40 hover:bg-tint-coral",
};

export function Button({
  variant = "outline",
  size = "md",
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md" }) {
  return (
    <button
      type="button"
      {...rest}
      className={cx(
        "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-[7px] font-medium transition-colors disabled:pointer-events-none disabled:opacity-45",
        size === "sm" ? "h-8 px-2.5 text-[12.5px]" : "h-9 px-3.5 text-[13.5px]",
        variants[variant],
        className,
      )}
    >
      {children}
    </button>
  );
}

export function IconButton({ label, className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      {...rest}
      className={cx("inline-grid size-9 shrink-0 place-items-center rounded-[7px] text-muted transition-colors hover:bg-soft hover:text-ink", className)}
    >
      {children}
    </button>
  );
}

const field = "w-full rounded-[7px] border border-line bg-surface px-3 text-[14px] text-ink placeholder:text-faint transition-colors hover:border-line-strong focus:border-accent focus:outline-none";

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...rest} className={cx(field, "h-9", className)} />;
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...rest} className={cx(field, "min-h-24 py-2 leading-relaxed", className)} />;
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...rest} className={cx(field, "h-9 pr-8", className)}>
      {children}
    </select>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12.5px] font-medium text-ink">{label}</span>
      {children}
      {hint && <span className="text-[12px] text-muted">{hint}</span>}
    </label>
  );
}

/** Round check for tasks and to-dos. */
export function Check({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className={cx(
        "grid size-[18px] shrink-0 place-items-center rounded-full border-[1.5px] transition-colors",
        checked ? "border-accent bg-accent text-paper" : "border-line-strong hover:border-accent",
      )}
    >
      {checked && <CheckMark size={11} weight="bold" />}
    </button>
  );
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cx("relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors", checked ? "bg-accent" : "bg-line-strong")}
    >
      <span className={cx("absolute top-[3px] size-4 rounded-full bg-surface shadow-sm transition-[left]", checked ? "left-[19px]" : "left-[3px]")} />
    </button>
  );
}

/** Underlined tabs. */
export function Tabs<T extends string>({ items, value, onChange, label, className }: { items: readonly (T | [T, ReactNode])[]; value: T; onChange: (v: T) => void; label: string; className?: string }) {
  return (
    <div role="tablist" aria-label={label} className={cx("no-scrollbar flex gap-5 overflow-x-auto border-b border-line", className)}>
      {items.map((it) => {
        const [key, text] = Array.isArray(it) ? it : [it, it];
        const on = key === value;
        return (
          <button
            key={key}
            role="tab"
            type="button"
            aria-selected={on}
            onClick={() => onChange(key)}
            className={cx(
              "-mb-px shrink-0 whitespace-nowrap border-b-[1.5px] pb-2.5 pt-1 text-[13.5px] transition-colors",
              on ? "border-ink font-medium text-ink" : "border-transparent text-muted hover:text-ink",
            )}
          >
            {text}
          </button>
        );
      })}
    </div>
  );
}

/** Small segmented switch for view modes (Day / Week / Month). */
export function Segmented<T extends string>({ items, value, onChange, label }: { items: readonly T[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-[8px] border border-line bg-surface p-0.5">
      {items.map((it) => (
        <button
          key={it}
          type="button"
          role="radio"
          aria-checked={it === value}
          onClick={() => onChange(it)}
          className={cx("h-7 rounded-[6px] px-2.5 text-[12.5px] transition-colors max-md:h-9 max-md:px-3", it === value ? "bg-soft font-medium text-ink" : "text-muted hover:text-ink")}
        >
          {it}
        </button>
      ))}
    </div>
  );
}

/* Overlays --------------------------------------------------------------------------------------- */

/** A side sheet on desktop, bottom sheet on phones. Built on <dialog> for focus and Escape handling. */
export function Sheet({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="orbit-sheet m-0 ml-auto h-dvh max-h-dvh w-full max-w-[460px] border-l border-line bg-paper p-0 text-ink backdrop:bg-[color-mix(in_srgb,var(--ink)_28%,transparent)] max-sm:mt-auto max-sm:h-[88dvh] max-sm:max-w-none max-sm:rounded-t-[14px] max-sm:border-l-0 max-sm:border-t"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
          <h2 className="font-serif text-[22px] leading-tight tracking-[-0.01em]">{title}</h2>
          <IconButton label="Close" onClick={onClose}>
            <X size={17} />
          </IconButton>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
      </div>
    </dialog>
  );
}

/* Empty and loading -------------------------------------------------------------------------------- */

export function Empty({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="py-12 text-center">
      <p className="font-serif text-[20px] italic text-ink">{title}</p>
      {children && <p className="mx-auto mt-1.5 max-w-[42ch] text-[13.5px] text-muted">{children}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("animate-pulse rounded-[6px] bg-soft", className)} />;
}

/* Charts ------------------------------------------------------------------------------------------ */

/** A thin line chart. Values oldest first. */
export function Sparkline({ values, width = 120, height = 32, className, area = false }: { values: number[]; width?: number; height?: number; className?: string; area?: boolean }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * width, height - 2 - ((v - min) / span) * (height - 4)] as const);
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} className={cx("overflow-visible text-accent", className)} aria-hidden>
      {area && <path d={`${d} L${width} ${height} L0 ${height} Z`} fill="currentColor" opacity={0.08} />}
      <path d={d} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** Simple vertical bars with an optional highlighted bar. */
export function Bars({ values, highlight, height = 64, className, labels }: { values: number[]; highlight?: number; height?: number; className?: string; labels?: string[] }) {
  const max = Math.max(...values, 1);
  return (
    <div className={cx("flex items-end gap-[3px]", className)} style={{ height }} aria-hidden>
      {values.map((v, i) => (
        <div key={i} className="flex h-full min-w-0 flex-1 flex-col justify-end gap-1">
          <div className={cx("w-full rounded-[2px]", i === highlight ? "bg-accent" : "bg-line-strong")} style={{ height: `${Math.max(2, (v / max) * 100)}%` }} />
          {labels && <span className="text-center font-mono text-[9.5px] text-faint">{labels[i]}</span>}
        </div>
      ))}
    </div>
  );
}

/** A horizontal meter, e.g. budget used. */
export function Meter({ value, max, tone = "accent", className }: { value: number; max: number; tone?: Tone; className?: string }) {
  const pct = Math.min(100, (value / max) * 100);
  const c = pct >= 100 ? "bg-coral" : { neutral: "bg-faint", accent: "bg-accent", info: "bg-info", warn: "bg-warn", coral: "bg-coral" }[tone];
  return (
    <div className={cx("h-1.5 w-full overflow-hidden rounded-full bg-soft", className)}>
      <div className={cx("h-full rounded-full", c)} style={{ width: `${pct}%` }} />
    </div>
  );
}

/* Toasts ------------------------------------------------------------------------------------------ */

type ToastMsg = { id: number; text: string; action?: { label: string; run: () => void } };
let toasts: ToastMsg[] = [];
const toastListeners = new Set<(t: ToastMsg[]) => void>();

/** Show a short confirmation: `toast("Task added", { label: "Undo", run: undo })`. */
export function toast(text: string, action?: ToastMsg["action"]) {
  const t = { id: Date.now() + Math.random(), text, action };
  toasts = [...toasts, t].slice(-3);
  toastListeners.forEach((l) => l(toasts));
  window.setTimeout(() => {
    toasts = toasts.filter((x) => x.id !== t.id);
    toastListeners.forEach((l) => l(toasts));
  }, 4200);
}

export function Toasts() {
  const [list, setList] = useState<ToastMsg[]>(toasts);
  useEffect(() => {
    toastListeners.add(setList);
    return () => void toastListeners.delete(setList);
  }, []);
  return (
    <div aria-live="polite" className="pointer-events-none fixed bottom-20 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2 md:bottom-6 md:left-auto md:right-6 md:translate-x-0 md:items-end">
      {list.map((t) => (
        <div key={t.id} className="pointer-events-auto flex items-center gap-4 rounded-[8px] bg-ink px-4 py-2.5 text-[13.5px] text-paper shadow-[0_12px_32px_-12px_var(--shade)]">
          {t.text}
          {t.action && (
            <button
              type="button"
              className="font-medium text-paper underline decoration-paper/40 underline-offset-4 hover:decoration-paper"
              onClick={() => {
                t.action!.run();
                toasts = toasts.filter((x) => x.id !== t.id);
                toastListeners.forEach((l) => l(toasts));
              }}
            >
              {t.action.label}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
