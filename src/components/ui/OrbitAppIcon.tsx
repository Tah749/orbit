import { useId } from "react";

/** Orbit's app icon: the Tracked mark on an ink tile. Mirrors drawOrbitIcon in src/story/brands.ts. */
export function OrbitAppIcon({ className = "size-12", title }: { className?: string; title?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 100 100" className={className} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <defs>
        <linearGradient id={`${id}bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2A2723" />
          <stop offset="1" stopColor="#151412" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="22.5" fill={`url(#${id}bg)`} />
      <g transform="translate(21.7 21.7) scale(0.566)">
        <circle cx="44" cy="56" r="29" fill="none" stroke="#F5F3EF" strokeWidth="11" />
        <circle cx="84" cy="22" r="10" fill="#5CC9BC" />
      </g>
      <rect x="0.5" y="0.5" width="99" height="99" rx="22" fill="none" stroke="#FFFFFF" strokeOpacity="0.08" />
    </svg>
  );
}
