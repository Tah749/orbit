import type { CalendarId } from "@orbit/data/calendar";
import type { Tone } from "../../ui";
import type { Colors } from "../../theme";

/** Calendar colours: a thin rule plus a tint, never a solid block. */
export const calTone: Record<CalendarId, Tone> = { personal: "accent", work: "info", family: "warn", travel: "coral" };

export function calColors(c: Colors, id: CalendarId) {
  return {
    personal: { rule: c.accent, tint: c.accentBg },
    work: { rule: c.info, tint: c.tintInfo },
    family: { rule: c.warn, tint: c.tintWarn },
    travel: { rule: c.coral, tint: c.tintCoral },
  }[id];
}
