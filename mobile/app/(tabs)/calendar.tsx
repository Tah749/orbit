import { useCallback, useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { CaretLeft, CaretRight, Plus } from "phosphor-react-native";
import { calendars, type CalEvent, type CalendarId } from "@orbit/data/calendar";
import { addDays, addMonths, clashIds, dayHeading, dayStart, eventsOn, minuteOf, monthHeading, onDay, rangeLabel } from "@orbit/sections/calendar/lib";
import { ymd } from "@orbit/time";
import { useTheme } from "../../src/theme";
import { useDB } from "../../src/store";
import { Button, Empty, IconButton, Label, Page, Screen, Section, Segmented, Text, useSimulatedLoad } from "../../src/ui";
import { Agenda, CalendarSkeleton, CalendarsList, DayGrid, DayStrip, EventRow, FreeTime, MonthGrid } from "../../src/sections/calendar/views";

const views = ["Agenda", "Day", "Month"] as const;
type View_ = (typeof views)[number];

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);
  return now;
}

const AGENDA_DAYS = 7;

function summary(list: CalEvent[], clashes: Set<string>) {
  if (!list.length) return "Nothing planned.";
  const n = list.length;
  const k = list.filter((e) => clashes.has(e.id)).length;
  return `${n} ${n === 1 ? "event" : "events"}${k ? `, ${k} overlapping` : ""}.`;
}

export default function CalendarScreen() {
  const { c } = useTheme();
  const router = useRouter();
  const now = useNow();
  const all = useDB((d) => d.events);
  const monday = useDB((d) => d.settings.weekStartsMonday);
  const [view, setView] = useState<View_>("Agenda");
  const [anchor, setAnchor] = useState(() => dayStart(new Date()));
  const [hidden, setHidden] = useState<Set<CalendarId>>(() => new Set());
  const [refresh, setRefresh] = useState(0);
  const loading = useSimulatedLoad("calendar", refresh);
  const onRefresh = useCallback(() => setRefresh((n) => n + 1), []);

  const visible = useMemo(() => all.filter((e) => !hidden.has(e.calendar)), [all, hidden]);
  const clashes = useMemo(() => clashIds(all), [all]);

  const days = useMemo(() => {
    if (view === "Day") return [anchor];
    if (view === "Month") {
      const n = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0).getDate();
      return Array.from({ length: n }, (_, i) => new Date(anchor.getFullYear(), anchor.getMonth(), i + 1));
    }
    return Array.from({ length: AGENDA_DAYS }, (_, i) => addDays(anchor, i));
  }, [view, anchor]);
  const inRange = visible.filter((e) => days.some((d) => onDay(e, d)));
  const counts = Object.fromEntries(calendars.map((cal) => [cal.id, all.filter((e) => e.calendar === cal.id && days.some((d) => onDay(e, d))).length])) as Record<CalendarId, number>;

  const step = (dir: 1 | -1) => setAnchor((a) => (view === "Month" ? addMonths(a, dir) : addDays(a, dir * (view === "Day" ? 1 : AGENDA_DAYS))));
  const unit = view === "Month" ? "month" : view === "Day" ? "day" : "week";
  const heading = view === "Day" ? dayHeading(anchor) : view === "Month" ? monthHeading(anchor) : rangeLabel(days[0], days[days.length - 1]);

  const open = (id: string) => router.push(`/event/${id}`);
  const create = (day: Date, from?: number, to?: number) => {
    const today = dayStart(new Date());
    const start = from ?? (day.getTime() === today.getTime() ? Math.min(Math.ceil((minuteOf(new Date()) + 1) / 60) * 60, 22 * 60) : 9 * 60);
    router.push({ pathname: "/event/new", params: { date: ymd(day), start: String(start), ...(to ? { end: String(to) } : {}) } });
  };
  const toggle = (id: CalendarId) =>
    setHidden((h) => {
      const next = new Set(h);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const dayList = eventsOn(visible, anchor);

  return (
    <Screen onRefresh={onRefresh}>
      <Page
        eyebrow="Calendar"
        title={heading}
        lede={loading ? undefined : summary(inRange, clashes)}
        actions={
          <IconButton label="New event" onPress={() => create(view === "Month" ? dayStart(new Date()) : anchor)} style={{ backgroundColor: c.ink }}>
            <Plus size={18} weight="bold" color={c.paper} />
          </IconButton>
        }
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <IconButton label={`Previous ${unit}`} onPress={() => step(-1)} style={{ borderWidth: 1, borderColor: c.line, backgroundColor: c.surface }}>
              <CaretLeft size={16} color={c.ink} />
            </IconButton>
            <Button size="sm" onPress={() => setAnchor(dayStart(new Date()))} style={{ minHeight: 44 }}>
              Today
            </Button>
            <IconButton label={`Next ${unit}`} onPress={() => step(1)} style={{ borderWidth: 1, borderColor: c.line, backgroundColor: c.surface }}>
              <CaretRight size={16} color={c.ink} />
            </IconButton>
          </View>
          <Segmented label="Calendar view" items={views} value={view} onChange={setView} />
        </View>

        <View style={{ gap: 16, marginBottom: 28 }}>
          {loading ? (
            <CalendarSkeleton view={view} />
          ) : (
            <>
              {view === "Day" && <DayStrip anchor={anchor} monday={monday} now={now} events={visible} onPick={setAnchor} />}
              {(view === "Day" || view === "Agenda") && <FreeTime day={anchor} events={all} now={now} onPick={create} />}
              {view === "Agenda" && <Agenda days={days} events={visible} clashes={clashes} now={now} onOpen={open} />}
              {view === "Day" && <DayGrid day={anchor} events={visible} clashes={clashes} now={now} onOpen={open} onCreate={create} />}
              {view === "Month" && (
                <>
                  <MonthGrid anchor={anchor} monday={monday} events={visible} now={now} onPickDay={setAnchor} />
                  <View>
                    <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6 }}>
                      <Text size={13.5} font="sansSemi" accessibilityRole="header">
                        {dayHeading(anchor)}
                      </Text>
                      <Button variant="ghost" size="sm" onPress={() => setView("Day")}>
                        Day view
                      </Button>
                    </View>
                    <View style={{ borderTopWidth: 1, borderTopColor: c.line }}>
                      {dayList.length ? (
                        dayList.map((e) => (
                          <View key={e.id} style={{ borderBottomWidth: 1, borderBottomColor: c.line }}>
                            <EventRow e={e} clash={clashes.has(e.id)} past={!e.allDay && new Date(e.end) < now} onOpen={open} />
                          </View>
                        ))
                      ) : (
                        <Empty title="Nothing planned">A clear day. Add something with the plus button.</Empty>
                      )}
                    </View>
                  </View>
                </>
              )}
            </>
          )}
        </View>

        <Section title="Calendars" meta="Choose what shows">
          <CalendarsList hidden={hidden} onToggle={toggle} counts={counts} />
        </Section>
        {!loading && hidden.size === calendars.length ? <Label tone="faint">All calendars are hidden.</Label> : null}
      </Page>
    </Screen>
  );
}
