import { useId } from "react";

/** Orbit's app icon: a lit sphere in a tilted ring with a satellite. Mirrors drawOrbitIcon in src/story/brands.ts. */
export function OrbitAppIcon({ className = "size-12", title }: { className?: string; title?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 100 100" className={className} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <defs>
        <linearGradient id={`${id}bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2B1646" />
          <stop offset="0.55" stopColor="#140E22" />
          <stop offset="1" stopColor="#0B0A10" />
        </linearGradient>
        <radialGradient id={`${id}glow`} cx="0.5" cy="0.52" r="0.62">
          <stop offset="0" stopColor="#FF4D7A" stopOpacity="0.42" />
          <stop offset="0.45" stopColor="#7C4DFF" stopOpacity="0.18" />
          <stop offset="1" stopColor="#7C4DFF" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}orb`} cx="50" cy="50" r="20.5" fx="43" fy="41" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFE0EA" />
          <stop offset="0.32" stopColor="#FF4D7A" />
          <stop offset="0.72" stopColor="#7C4DFF" />
          <stop offset="1" stopColor="#2A1A55" />
        </radialGradient>
        <linearGradient id={`${id}ring`} x1="10" y1="50" x2="90" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#C9B8FF" />
          <stop offset="0.5" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#FF8CAA" />
        </linearGradient>
        <clipPath id={`${id}clip`}>
          <rect width="100" height="100" rx="22.5" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}clip)`}>
        <rect width="100" height="100" fill={`url(#${id}bg)`} />
        <rect width="100" height="100" fill={`url(#${id}glow)`} />
        <g transform="rotate(-24 50 50)" fill="none" strokeLinecap="round">
          <path d="M10 50 A40 14 0 0 1 90 50" stroke={`url(#${id}ring)`} strokeOpacity="0.45" strokeWidth="3" />
        </g>
        <circle cx="50" cy="50" r="20.5" fill={`url(#${id}orb)`} />
        <g transform="rotate(-24 50 50)" fill="none" strokeLinecap="round">
          <path d="M10 50 A40 14 0 0 0 90 50" stroke={`url(#${id}ring)`} strokeWidth="3.6" />
        </g>
        <circle cx="82.9" cy="44.2" r="4.5" fill="#FFFFFF" />
      </g>
      <rect x="0.5" y="0.5" width="99" height="99" rx="22" fill="none" stroke="#FFFFFF" strokeOpacity="0.1" />
    </svg>
  );
}
