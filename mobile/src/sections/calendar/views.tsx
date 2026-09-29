import { useMemo } from "react";
import { Pressable, View } from "react-native";
import { calendars, type CalEvent, type CalendarId } from "@orbit/data/calendar";
import { time } from "@orbit/time";
import { calTone as toneOf, calColors } from "./tone";
import { byStart, dayHeading, duration, eventsOn, freeGaps, hhmm, layoutDay, minuteOf, onDay, sameDate, weekStart, weekdayLetter, weekdayShort, addDays, type Placed } from "@orbit/sections/calendar/lib";
import { useTheme } from "../../theme";
import { Dot, Label, Skeleton, SkeletonBlock, SkeletonRow, Source, Text } from "../../ui";
import { Check as CheckMark } from "phosphor-react-native";

/** The small coral mark on an event that overlaps another. */
export function ClashMark() {
  const { c } = useTheme();
  return <View accessibilityLabel="Overlaps another event" style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.coral }} />;
}

/* Agenda ------------------------------------------------------------------------------------------ */

export function EventRow({ e, clash, past, onOpen, showDate }: { e: CalEvent; clash: boolean; past?: boolean; onOpen: (id: string) => void; showDate?: boolean }) {
  const { c } = useTheme();
  const place = [e.location, e.video && `${e.video} call`].filter(Boolean).join(" · ");
  return (
    <Pressable
      onPress={() => onOpen(e.id)}
      accessibilityRole="button"
      accessibilityLabel={`${e.title}, ${e.allDay ? "all day" : `${time(e.start)} to ${time(e.end)}`}${clash ? ", overlaps another event" : ""}`}
      style={({ pressed }) => ({ flexDirection: "row", alignItems: "flex-start", gap: 12, minHeight: 56, paddingVertical: 10, paddingHorizontal: 2, backgroundColor: pressed ? c.soft : "transparent", opacity: past ? 0.6 : 1 })}
    >
      <View style={{ width: 44, paddingTop: 1 }}>
        {e.allDay ? (
          <Text size={11.5} font="mono" tone="muted">
            All day
          </Text>
        ) : (
          <>
            <Text size={12} font="mono" num tone="muted">
              {time(e.start)}
            </Text>
            <Text size={12} font="mono" num tone="faint">
              {time(e.end)}
            </Text>
          </>
        )}
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Dot tone={toneOf[e.calendar]} size={7} />
          <Text size={14.5} lines={1} style={{ flexShrink: 1 }}>
            {e.title}
          </Text>
          {clash ? <ClashMark /> : null}
        </View>
        {place ? (
          <Text size={12.5} tone="muted" lines={1}>
            {place}
          </Text>
        ) : null}
        <Source id={e.source} />
      </View>
    </Pressable>
  );
}

export function DayLabel({ d, now }: { d: Date; now: Date }) {
  const today = sameDate(d, now);
  const { fonts } = useTheme();
  return (
    <View style={{ width: 48, paddingTop: 8 }}>
      <Label tone={today ? "accent" : "muted"}>{today ? "Today" : weekdayShort(d)}</Label>
      <Text size={26} tone={today ? "accent" : "ink"} num style={{ fontFamily: fonts.serif, lineHeight: 30, marginTop: 2 }}>
        {d.getDate()}
      </Text>
    </View>
  );
}

/** A plain list, day by day. */
export function Agenda({ days, events, clashes, now, onOpen }: { days: Date[]; events: CalEvent[]; clashes: Set<string>; now: Date; onOpen: (id: string) => void }) {
  const { c } = useTheme();
  return (
    <View style={{ borderTopWidth: 1, borderTopColor: c.line }}>
      {days.map((d) => {
        const list = eventsOn(events, d);
        return (
          <View key={d.getTime()} style={{ flexDirection: "row", gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: c.line }}>
            <DayLabel d={d} now={now} />
            <View style={{ flex: 1, minWidth: 0 }}>
              {list.length ? (
                list.map((e) => <EventRow key={e.id} e={e} clash={clashes.has(e.id)} past={!e.allDay && new Date(e.end) < now} onOpen={onOpen} />)
              ) : (
                <View style={{ minHeight: 48, justifyContent: "center", paddingLeft: 2 }}>
                  <Text size={13} tone="faint">
                    Nothing planned
                  </Text>
                </View>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

/* Day strip and free time -------------------------------------------------------------------------- */

/** A week of days to pick from. */
export function DayStrip({ anchor, monday, now, events, onPick }: { anchor: Date; monday: boolean; now: Date; events: CalEvent[]; onPick: (d: Date) => void }) {
  const { c } = useTheme();
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart(anchor, monday), i));
  return (
    <View accessibilityLabel="Choose a day" style={{ flexDirection: "row", gap: 4 }}>
      {days.map((d) => {
        const sel = sameDate(d, anchor);
        const today = sameDate(d, now);
        const busy = events.some((e) => onDay(e, d));
        return (
          <Pressable
            key={d.getTime()}
            onPress={() => onPick(d)}
            accessibilityRole="button"
            accessibilityLabel={dayHeading(d)}
            accessibilityState={{ selected: sel }}
            style={{ flex: 1, height: 60, borderRadius: 8, borderWidth: 1, borderColor: sel ? c.lineStrong : "transparent", backgroundColor: sel ? c.surface : "transparent", alignItems: "center", justifyContent: "center", gap: 4 }}
          >
            <Label tone={today ? "accent" : "faint"}>{weekdayLetter(d)}</Label>
            <Text size={15} num tone={today ? "accent" : "ink"} font={today ? "sansMedium" : "sans"}>
              {d.getDate()}
            </Text>
            <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: busy ? (sel ? c.ink : c.faint) : "transparent" }} />
          </Pressable>
        );
      })}
    </View>
  );
}

/** "Free 10:00-12:30": gaps of an hour or more in the working day. Each one starts a new event. */
export function FreeTime({ day, events, now, onPick }: { day: Date; events: CalEvent[]; now: Date; onPick: (day: Date, from: number, to: number) => void }) {
  const { c } = useTheme();
  const today = sameDate(day, now);
  if (day.getTime() + 86_400_000 <= now.getTime()) return null;
  let gaps = freeGaps(events, day);
  if (today) {
    const m = now.getHours() * 60 + now.getMinutes();
    gaps = gaps.map((g) => ({ from: Math.max(g.from, Math.ceil(m / 15) * 15), to: g.to })).filter((g) => g.to - g.from >= 60);
  }
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: c.line }}>
      <Label>{today ? "Free today" : `Free ${weekdayShort(day)} ${day.getDate()}`}</Label>
      {gaps.length ? (
        gaps.map((g) => (
          <Pressable
            key={g.from}
            onPress={() => onPick(day, g.from, Math.min(g.to, g.from + 60))}
            accessibilityRole="button"
            accessibilityLabel={`Add an event between ${hhmm(g.from)} and ${hhmm(g.to)}`}
            style={{ minHeight: 36, borderRadius: 5, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", gap: 6 }}
          >
            <Text size={12.5} font="mono" num>
              {hhmm(g.from)}–{hhmm(g.to)}
            </Text>
            <Text size={12.5} tone="muted">
              {duration(g.to - g.from)}
            </Text>
          </Pressable>
        ))
      ) : (
        <Text size={13} tone="muted">
          No free hour between 09:00 and 18:00{today ? " left today" : ""}.
        </Text>
      )}
    </View>
  );
}

/* Day: a vertical time grid ------------------------------------------------------------------------ */

const HH = 52; // pixels per hour

export function DayGrid({ day, events, clashes, now, onOpen, onCreate }: { day: Date; events: CalEvent[]; clashes: Set<string>; now: Date; onOpen: (id: string) => void; onCreate: (day: Date, minute: number) => void }) {
  const { c } = useTheme();
  const placed = useMemo(() => layoutDay(events, day), [events, day]);
  const allDay = events.filter((e) => e.allDay && onDay(e, day)).sort(byStart);
  // Opens at 06:00, or earlier if something starts before then.
  const startH = Math.min(6, Math.floor(Math.min(1440, ...placed.map((p) => p.from)) / 60));
  const hours = Array.from({ length: 24 - startH }, (_, i) => startH + i);
  const today = sameDate(day, now);
  const nowMin = minuteOf(now);
  return (
    <View>
      {allDay.length > 0 && (
        <View style={{ gap: 4, marginBottom: 10 }}>
          <Label>All day</Label>
          {allDay.map((e) => {
            const col = calColors(c, e.calendar);
            return (
              <Pressable key={e.id} onPress={() => onOpen(e.id)} accessibilityRole="button" accessibilityLabel={`${e.title}, all day`} style={{ minHeight: 40, borderLeftWidth: 2, borderLeftColor: col.rule, backgroundColor: col.tint, borderRadius: 4, paddingHorizontal: 10, paddingVertical: 8, justifyContent: "center", gap: 2 }}>
                <Text size={13.5} font="sansMedium" lines={1}>
                  {e.title}
                </Text>
                <Source id={e.source} />
              </Pressable>
            );
          })}
        </View>
      )}
      <View style={{ flexDirection: "row", borderTopWidth: 1, borderTopColor: c.line }}>
        <View style={{ width: 44, height: hours.length * HH }}>
          {hours.slice(1).map((h) => (
            <Text key={h} size={10} font="mono" num tone="faint" style={{ position: "absolute", top: (h - startH) * HH - 7, right: 8 }}>
              {hhmm(h * 60)}
            </Text>
          ))}
        </View>
        <View style={{ flex: 1, height: hours.length * HH, borderLeftWidth: 1, borderLeftColor: c.line, backgroundColor: today ? c.accentBg + "59" : "transparent" }}>
          {hours.map((h) => (
            <Pressable
              key={h}
              onPress={(ev) => onCreate(day, Math.min(h * 60 + (ev.nativeEvent.locationY > HH / 2 ? 30 : 0), 23 * 60))}
              accessibilityRole="button"
              accessibilityLabel={`New event at ${hhmm(h * 60)}`}
              style={{ position: "absolute", left: 0, right: 0, top: (h - startH) * HH, height: HH, borderTopWidth: h > startH ? 1 : 0, borderTopColor: c.line }}
            />
          ))}
          {placed.map((p) => (
            <Block key={p.e.id} p={p} startH={startH} clash={clashes.has(p.e.id)} onOpen={onOpen} />
          ))}
          {today && nowMin >= startH * 60 && (
            <View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, top: ((nowMin - startH * 60) / 60) * HH, zIndex: 5 }}>
              <View style={{ height: 1, backgroundColor: c.accent }} />
              <View style={{ position: "absolute", left: -4, top: -3.5, width: 7, height: 7, borderRadius: 3.5, backgroundColor: c.accent }} />
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

function Block({ p, startH, clash, onOpen }: { p: Placed; startH: number; clash: boolean; onOpen: (id: string) => void }) {
  const { c } = useTheme();
  const { e } = p;
  const top = ((p.from - startH * 60) / 60) * HH;
  const height = Math.max(((p.to - p.from) / 60) * HH - 2, 22);
  const compact = height < 40;
  const narrow = p.cols > 1;
  const col = calColors(c, e.calendar);
  const range = `${time(e.start)}–${time(e.end)}`;
  return (
    <Pressable
      onPress={() => onOpen(e.id)}
      accessibilityRole="button"
      accessibilityLabel={`${e.title}, ${range}${clash ? ", overlaps another event" : ""}`}
      style={{
        position: "absolute",
        top: top + 1,
        height,
        left: `${(p.col / p.cols) * 100}%`,
        width: `${100 / p.cols}%`,
        paddingLeft: 3,
        paddingRight: 2,
        zIndex: 2,
      }}
    >
      <View style={{ flex: 1, borderLeftWidth: 2, borderLeftColor: col.rule, backgroundColor: col.tint, borderRadius: 5, paddingHorizontal: 6, paddingVertical: compact ? 2 : 4, overflow: "hidden", flexDirection: compact ? "row" : "column", alignItems: compact ? "center" : "flex-start", gap: compact ? 6 : 1 }}>
        {clash ? (
          <View style={{ position: "absolute", top: 4, right: 4 }}>
            <ClashMark />
          </View>
        ) : null}
        <Text size={12} font="sansMedium" lines={compact ? 1 : narrow ? 3 : 2} style={{ lineHeight: 15, flexShrink: 1 }}>
          {e.title}
        </Text>
        {(!compact || !narrow) && (
          <Text size={10.5} font="mono" num tone="muted" lines={1}>
            {compact || narrow ? time(e.start) : range}
          </Text>
        )}
        {!compact && !narrow && e.location && height >= 62 ? (
          <Text size={11.5} tone="muted" lines={1}>
            {e.location}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

/* Month -------------------------------------------------------------------------------------------- */

export function MonthGrid({ anchor, monday, events, now, onPickDay }: { anchor: Date; monday: boolean; events: CalEvent[]; now: Date; onPickDay: (d: Date) => void }) {
  const { c } = useTheme();
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const start = weekStart(first, monday);
  const last = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
  const weeks = Math.ceil((Math.round((last.getTime() - start.getTime()) / 86_400_000) + 1) / 7);
  const days = Array.from({ length: weeks * 7 }, (_, i) => addDays(start, i));
  return (
    <View style={{ borderWidth: 1, borderColor: c.line, borderRadius: 10, backgroundColor: c.surface, overflow: "hidden" }}>
      <View style={{ flexDirection: "row", borderBottomWidth: 1, borderBottomColor: c.line, paddingVertical: 8 }}>
        {days.slice(0, 7).map((d) => (
          <View key={d.getDay()} style={{ width: `${100 / 7}%`, alignItems: "center" }}>
            <Label>{weekdayLetter(d)}</Label>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {days.map((d, i) => {
          const list = eventsOn(events, d);
          const inMonth = d.getMonth() === anchor.getMonth();
          const today = sameDate(d, now);
          const sel = sameDate(d, anchor);
          return (
            <Pressable
              key={d.getTime()}
              onPress={() => onPickDay(d)}
              accessibilityRole="button"
              accessibilityLabel={`${dayHeading(d)}, ${list.length ? `${list.length} event${list.length > 1 ? "s" : ""}` : "nothing planned"}`}
              accessibilityState={{ selected: sel }}
              style={{ width: `${100 / 7}%`, height: 58, alignItems: "center", paddingTop: 6, gap: 5, borderBottomWidth: i < days.length - 7 ? 1 : 0, borderBottomColor: c.line, backgroundColor: !inMonth ? c.paper : "transparent" }}
            >
              <View style={{ width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: today ? c.accent : "transparent", borderWidth: sel && !today ? 1 : 0, borderColor: c.ink }}>
                <Text size={13} num tone={today ? "paper" : inMonth ? "ink" : "faint"} font={today ? "sansMedium" : "sans"}>
                  {d.getDate()}
                </Text>
              </View>
              <View style={{ flexDirection: "row", gap: 3, height: 5 }}>
                {list.slice(0, 4).map((e) => (
                  <Dot key={e.id} tone={toneOf[e.calendar]} size={5} />
                ))}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/* Calendars filter --------------------------------------------------------------------------------- */

export function CalendarsList({ hidden, onToggle, counts }: { hidden: Set<CalendarId>; onToggle: (id: CalendarId) => void; counts: Record<CalendarId, number> }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4 }}>
      {calendars.map((cal) => {
        const on = !hidden.has(cal.id);
        const col = calColors(c, cal.id).rule;
        return (
          <View key={cal.id} style={{ width: "50%", padding: 4 }}>
            <Pressable
              onPress={() => onToggle(cal.id)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              accessibilityLabel={`${cal.name}, ${counts[cal.id]} events`}
              style={({ pressed }) => ({ minHeight: 52, flexDirection: "row", alignItems: "flex-start", gap: 10, paddingHorizontal: 6, paddingVertical: 8, borderRadius: 7, backgroundColor: pressed ? c.soft : "transparent" })}
            >
              <View style={{ width: 16, height: 16, marginTop: 2, borderRadius: 3, borderWidth: 1.5, borderColor: on ? col : c.lineStrong, backgroundColor: on ? col : "transparent", alignItems: "center", justifyContent: "center" }}>
                {on ? <CheckMark size={10} weight="bold" color={c.paper} /> : null}
              </View>
              <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 6 }}>
                  <Text size={13.5} tone={on ? "ink" : "muted"}>
                    {cal.name}
                  </Text>
                  <Text size={10.5} font="mono" num tone="faint">
                    {counts[cal.id] || ""}
                  </Text>
                </View>
                <Source id={cal.source} />
              </View>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

/* Skeletons ---------------------------------------------------------------------------------------- */

/** Mirrors each view's layout while the calendar "syncs". */
export function CalendarSkeleton({ view }: { view: "Agenda" | "Day" | "Month" }) {
  const { c } = useTheme();
  if (view === "Month")
    return (
      <View style={{ gap: 12 }}>
        <SkeletonBlock height={58 * 5 + 34} />
        <View style={{ borderTopWidth: 1, borderTopColor: c.line }}>
          <SkeletonRow />
          <SkeletonRow />
        </View>
      </View>
    );
  if (view === "Day")
    return (
      <View style={{ gap: 12 }}>
        <View style={{ flexDirection: "row", gap: 4 }}>
          {Array.from({ length: 7 }, (_, i) => (
            <View key={i} style={{ flex: 1 }}>
              <Skeleton height={60} radius={8} />
            </View>
          ))}
        </View>
        <View style={{ borderTopWidth: 1, borderTopColor: c.line, paddingTop: 12, gap: 34 }}>
          {[62, 40, 84, 50].map((h, i) => (
            <View key={i} style={{ flexDirection: "row", gap: 10 }}>
              <Skeleton width={34} height={10} />
              <Skeleton width={i % 2 ? "58%" : "78%"} height={h} radius={5} />
            </View>
          ))}
        </View>
      </View>
    );
  return (
    <View style={{ borderTopWidth: 1, borderTopColor: c.line }}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={{ flexDirection: "row", gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.line }}>
          <View style={{ width: 48, gap: 6 }}>
            <Skeleton width={30} height={10} />
            <Skeleton width={28} height={26} />
          </View>
          <View style={{ flex: 1 }}>
            <SkeletonRow />
          </View>
        </View>
      ))}
    </View>
  );
}
