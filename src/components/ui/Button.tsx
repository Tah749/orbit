import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-[transform,background-color,box-shadow,border-color,color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60";

const variants: Record<Variant, string> = {
  // Dark label on the rose accent: 6.2:1 contrast.
  primary:
    "bg-accent text-paper hover:bg-[#ff6690] hover:shadow-[0_0_0_1px_rgba(255,77,122,0.4),0_8px_32px_-6px_rgba(255,77,122,0.55)]",
  secondary: "border border-line bg-surface/60 text-ink hover:border-[#433d52] hover:bg-soft",
  ghost: "text-muted hover:text-ink",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-[13.5px]",
  md: "h-11 px-5 text-[14.5px]",
  lg: "h-12 px-6 text-[15px]",
};

type Common = { variant?: Variant; size?: Size; children: ReactNode; className?: string };

export function Button({ variant = "primary", size = "md", className = "", ...rest }: Common & ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...rest} />;
}

export function ButtonLink({ variant = "primary", size = "md", className = "", ...rest }: Common & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...rest} />;
}
