import { useEffect, useRef, type ReactNode } from "react";
import { X } from "@phosphor-icons/react";

/** Interactive segmented control (the static one in previews is decorative). */
export function Segmented<T extends string>({
  items,
  value,
  onChange,
  label,
  className = "",
}: {
  items: readonly T[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  className?: string;
}) {
  return (
    <div role="tablist" aria-label={label} className={`inline-flex gap-1 rounded-full bg-soft p-1 ${className}`}>
      {items.map((it) => (
        <button
          key={it}
          role="tab"
          type="button"
          aria-selected={it === value}
          onClick={() => onChange(it)}
          className={`flex-1 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-colors ${
            it === value ? "bg-accent text-paper" : "text-muted hover:text-ink"
          }`}
        >
          {it}
        </button>
      ))}
    </div>
  );
}

export function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-[12.5px] transition-colors ${
        on ? "bg-accent font-medium text-paper" : "border border-line text-muted hover:border-[#433d52] hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-line bg-surface hairline-top ${className}`}>{children}</section>;
}

export function CardHead({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-[14px] font-medium text-ink">{title}</h2>
      {action}
    </div>
  );
}

export function LinkButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="text-[12.5px] text-muted transition-colors hover:text-accent-fg">
      {children}
    </button>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[26px] font-semibold tracking-[-0.03em] text-ink md:text-[30px]">{title}</h1>
        {subtitle && <p className="mt-1 text-[14px] text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export const money = (n: number) => `£${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Accessible modal dialog built on <dialog>. */
export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
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
      className="m-auto w-[min(92vw,460px)] rounded-3xl border border-line bg-surface p-0 text-ink shadow-[0_40px_100px_-30px_rgba(0,0,0,0.8)] backdrop:bg-black/60 backdrop:backdrop-blur-sm"
    >
      <div className="flex flex-col gap-4 p-6">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-[18px] font-medium tracking-[-0.02em]">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="grid size-8 place-items-center rounded-full text-muted hover:bg-soft hover:text-ink">
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
