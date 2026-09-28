import type { Icon } from "@phosphor-icons/react";
import type { ReactNode } from "react";

/** Shared building blocks for the product previews, so every screen speaks the same visual language. */

export const tones = {
  rose: "bg-accent-bg text-accent-fg",
  violet: "bg-tint-info text-info",
  amber: "bg-tint-warn text-warn",
  coral: "bg-tint-coral text-coral",
  neutral: "bg-soft text-muted",
} as const;
export type Tone = keyof typeof tones;

export function IconTile({ icon: I, tone = "rose", size = "md" }: { icon: Icon; tone?: Tone; size?: "sm" | "md" }) {
  const s = size === "sm" ? "size-7 rounded-lg" : "size-9 rounded-[10px]";
  return (
    <span className={`grid shrink-0 place-items-center ${s} ${tones[tone]}`}>
      <I size={size === "sm" ? 14 : 17} weight="regular" />
    </span>
  );
}

export function Pill({ children, tone = "neutral", className = "" }: { children: ReactNode; tone?: Tone | "solid"; className?: string }) {
  const t = tone === "solid" ? "bg-accent text-paper" : tones[tone];
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-medium ${t} ${className}`}>{children}</span>;
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-line bg-surface hairline-top ${className}`}>{children}</div>;
}

export function PanelTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h4 className="text-[12.5px] font-medium text-ink">{children}</h4>
      {action && <span className="text-[11px] text-muted">{action}</span>}
    </div>
  );
}

export function Tabs({ items, active = 0, className = "" }: { items: string[]; active?: number; className?: string }) {
  return (
    <div className={`flex gap-1 rounded-full bg-soft p-1 ${className}`}>
      {items.map((t, i) => (
        <span
          key={t}
          className={`flex-1 whitespace-nowrap rounded-full px-3 py-1 text-center text-[11px] font-medium ${
            i === active ? "bg-accent text-paper" : "text-muted"
          }`}
        >
          {t}
        </span>
      ))}
    </div>
  );
}

export function DemoTag({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border border-line bg-paper/70 px-2 py-0.5 text-[10px] font-medium text-muted ${className}`}>
      Demo data
    </span>
  );
}

/** A framed screen used for every feature preview. `aria-label` describes it for screen readers; inner UI is decorative. */
export function PreviewFrame({
  label,
  title,
  subtitle,
  icon,
  children,
  className = "",
}: {
  label: string;
  title: string;
  subtitle?: string;
  icon?: Icon;
  children: ReactNode;
  className?: string;
}) {
  const I = icon;
  return (
    <figure
      role="img"
      aria-label={label}
      className={`relative overflow-hidden rounded-[22px] border border-line bg-deep p-4 shadow-[0_40px_80px_-40px_var(--shade)] sm:p-5 ${className}`}
    >
      <div aria-hidden="true" className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {I && <I size={18} className="text-accent" />}
            <div>
              <p className="text-[15px] font-medium tracking-[-0.01em] text-ink">{title}</p>
              {subtitle && <p className="text-[11.5px] text-muted">{subtitle}</p>}
            </div>
          </div>
          <DemoTag />
        </div>
        {children}
      </div>
    </figure>
  );
}
