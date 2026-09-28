/**
 * Shared, mutable flight state. The page writes scroll position here and the
 * 3D scene reads it every frame, so scrolling never triggers a React render.
 */
export const flight = {
  /** Raw document scroll progress, 0 to 1. */
  progress: 0,
  /** Scroll progress at the centre of each chapter, measured on resize. */
  stops: [] as number[],
  /** Pointer position, -1 to 1 on each axis. */
  pointer: { x: 0, y: 0 },
  /** Screen-space label elements the scene positions over integration nodes. */
  labels: [] as (HTMLElement | null)[],
  /** Set once when the canvas has rendered its first frame. */
  ready: false,
};

export const chapterCount = 9;

/**
 * Maps scroll progress to a keyframe index (0 to chapterCount - 1). Each
 * segment is eased so the camera lingers at every chapter while it's being read.
 */
export function keyframeAt(p: number) {
  const s = flight.stops;
  if (s.length < 2) return p * (chapterCount - 1);
  if (p <= s[0]) return 0;
  for (let i = 0; i < s.length - 1; i++) {
    if (p <= s[i + 1]) {
      const f = (p - s[i]) / Math.max(1e-6, s[i + 1] - s[i]);
      const eased = f * f * (3 - 2 * f);
      return i + (f * 0.35 + eased * 0.65);
    }
  }
  return s.length - 1;
}
