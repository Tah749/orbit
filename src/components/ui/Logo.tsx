type LogoProps = { size?: "sm" | "md"; className?: string; showWordmark?: boolean };

export function Orb({ className = "size-5" }: { className?: string }) {
  return <span aria-hidden="true" className={`orb inline-block shrink-0 ${className}`} />;
}

export function Logo({ size = "md", className = "", showWordmark = true }: LogoProps) {
  const orb = size === "sm" ? "size-4" : "size-[22px]";
  const text = size === "sm" ? "text-[15px]" : "text-[18px]";
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Orb className={orb} />
      {showWordmark && <span className={`${text} font-medium tracking-[-0.02em] text-ink`}>Orbit</span>}
    </span>
  );
}
