type LogoProps = { size?: "sm" | "md"; className?: string; showWordmark?: boolean };

/** The Tracked mark: a monoline o with an accent tittle. Ink follows the text colour. */
export function Orb({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className={`inline-block shrink-0 ${className}`}>
      <circle cx="44" cy="56" r="29" fill="none" stroke="currentColor" strokeWidth="11" />
      <circle cx="84" cy="22" r="10" fill="var(--green)" />
    </svg>
  );
}

/** The Tracked wordmark: a light, widely spaced monoline "orbit" whose i carries the accent tittle. */
export function Wordmark({ className = "h-5" }: { className?: string }) {
  return (
    <svg viewBox="16 16 311 104" role="img" aria-label="Orbit" className={`inline-block shrink-0 ${className}`}>
      <g transform="translate(20 116.2) scale(1.3)">
        <path
          d="M2.5 -25a22.5 22.5 0 1 0 45 0a22.5 22.5 0 1 0 -45 0ZM76.5 0V-50M124.92 0V-74M124.92 -25a22.5 22.5 0 1 0 45 0a22.5 22.5 0 1 0 -45 0ZM76.5 -26.13A21.38 21.38 0 0 1 97.88 -47.5h5.34M198.92 0V-50M226.12 -63.2V0M220.62 -47.5H232.62"
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
        />
        <circle cx="198.92" cy="-61" r="5" fill="var(--green)" />
      </g>
    </svg>
  );
}

export function Logo({ size = "md", className = "", showWordmark = true }: LogoProps) {
  const h = size === "sm" ? "h-[15px]" : "h-[19px]";
  return (
    <span className={`inline-flex items-center text-ink ${className}`}>
      {showWordmark ? <Wordmark className={h} /> : <Orb className={size === "sm" ? "size-4" : "size-[22px]"} />}
    </span>
  );
}
