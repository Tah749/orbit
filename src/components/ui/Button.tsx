import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

const base =
  "inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[7px] px-4 text-[13.5px] font-medium transition-colors disabled:pointer-events-none disabled:opacity-45";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-paper hover:bg-ink/85",
  secondary: "border border-line bg-surface text-ink hover:border-line-strong hover:bg-soft/50",
  ghost: "text-muted hover:bg-soft hover:text-ink",
};

type Props = { variant?: Variant; children: ReactNode; className?: string } & ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({ variant = "primary", className = "", ...rest }: Props) {
  return <button className={`${base} ${variants[variant]} ${className}`} {...rest} />;
}
