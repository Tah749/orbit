/**
 * Shared, mutable state for the phone story. The page writes scroll position here and the
 * 3D scene reads it every frame, so scrolling never re-renders React.
 */
export const story = {
  progress: 0,
  /** Scroll progress at the centre of each act, measured on resize. */
  stops: [] as number[],
  pointer: { x: 0, y: 0 },
  /** App-name labels the scene pins to the network nodes in act III. */
  labels: [] as (HTMLElement | null)[],
  ready: false,
};

export const actCount = 6;

/** Scroll progress to an act position (0 to actCount - 1), eased so each act lingers while it's read. */
export function actAt(p: number) {
  const s = story.stops;
  if (s.length < 2) return p * (actCount - 1);
  if (p <= s[0]) return 0;
  for (let i = 0; i < s.length - 1; i++) {
    if (p <= s[i + 1]) {
      const f = (p - s[i]) / Math.max(1e-6, s[i + 1] - s[i]);
      const eased = f * f * (3 - 2 * f);
      return i + f * 0.4 + eased * 0.6;
    }
  }
  return s.length - 1;
}

export const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Rises a to b, holds, falls c to d. */
export const ramp = (a: number, b: number, c: number, d: number, x: number) => smooth(a, b, x) * (1 - smooth(c, d, x));
