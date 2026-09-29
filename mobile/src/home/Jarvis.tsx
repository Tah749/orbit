import { useMemo, useState, type ReactNode } from "react";
import { Text as RNText, View, useWindowDimensions } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { longDate, on, parse, relDay, time } from "@orbit/time";
import { money } from "@orbit/format";
import { useDB, type DB } from "../store";
import { GUTTER, Screen, Sparkline, useSimulatedLoad } from "../ui";
import { fonts, jarvis as J } from "../theme";
import { JarvisOrb } from "./JarvisOrb";
import { JarvisSkeleton } from "./JarvisSkeleton";
import { Gauge, JHeading, JLabel, JNum, JSerif, JText, Panel, SystemsFeed, TimeTrack } from "./JarvisParts";
import { useNow } from "./useNow";
import { STEP_GOAL, cashBalance, deliveriesInTransit, monthBudget, nextEvent, nextTrip, replies, revenueToday, spendSeries, tasksToday, timedToday, todayStats } from "./stats";

const all = (d: DB) => d;
const pad = (n: number) => String(n).padStart(2, "0");
const hm = (min: number) => `${Math.floor(min / 60)}h ${pad(min % 60)}m`;
const pct = (v: number, m: number) => (m > 0 ? `${Math.round((v / m) * 100)}%` : "--");

/** Live clock and countdown. Owns its one-second tick so the rest of the screen stays still. */
function Clock({ next }: { next?: { title: string; start: string } }) {
  const now = useNow(1000);
  const clock = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  let count = "";
  let spoken = "";
  if (next) {
    const s = Math.max(0, Math.floor((parse(next.start).getTime() - now.getTime()) / 1000));
    const h = Math.floor(s / 3600);
    count = `${pad(h)}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
    spoken = `Next: ${next.title} in ${h} hours ${Math.floor((s % 3600) / 60)} minutes`;
  }
  return (
    <View style={{ alignItems: "center", marginTop: 12 }}>
      <View accessible accessibilityLabel={`Time ${pad(now.getHours())}:${pad(now.getMinutes())}`} accessibilityRole="timer">
        <RNText style={{ fontFamily: fonts.monoMedium, fontSize: 34, color: J.text, letterSpacing: 1, fontVariant: ["tabular-nums"] }}>{clock}</RNText>
      </View>
      <JLabel style={{ marginTop: 4 }}>{longDate(on(0))}</JLabel>
      {next ? (
        <View accessible accessibilityLabel={spoken} style={{ marginTop: 14, alignItems: "center" }}>
          <JLabel color={J.tealDim}>{`Next: ${next.title}`.slice(0, 34)}</JLabel>
          <JNum size={17} color={J.teal} style={{ marginTop: 3 }}>
            {`T-${count}`}
          </JNum>
        </View>
      ) : (
        <JLabel style={{ marginTop: 14 }}>Nothing else in the diary</JLabel>
      )}
    </View>
  );
}

function Stat({ value, note, big }: { value: ReactNode; note: string; big?: boolean }) {
  return (
    <View>
      {big ? <JSerif>{value}</JSerif> : <JNum size={20}>{value}</JNum>}
      <JText size={12} style={{ marginTop: 2 }}>
        {note}
      </JText>
    </View>
  );
}

export function Jarvis({ header }: { header: ReactNode }) {
  const v = useDB(all);
  const now = useNow(60_000);
  const { width } = useWindowDimensions();
  const [refresh, setRefresh] = useState(0);
  const loading = useSimulatedLoad("home-jarvis", refresh);

  const orb = Math.min(width - GUTTER * 2, 268);
  const half = Math.floor((width - GUTTER * 2 - 10) / 2);
  const full = width - GUTTER * 2;

  const m = useMemo(() => {
    const budget = monthBudget(v);
    const cash = cashBalance(v);
    const tk = tasksToday(v);
    const rp = replies(v);
    const st = todayStats(v);
    const rev = revenueToday(v);
    const trip = nextTrip(v);
    const del = deliveriesInTransit(v);
    const timed = timedToday(v);
    const ne = nextEvent(v, now);
    return { budget, cash, tk, rp, st, rev, trip, del, timed, ne, series: spendSeries(v, 30), spend30: spendSeries(v, 30).reduce((a, b) => a + b, 0) };
  }, [v, now]);

  const connected = v.connections.filter((c) => c.status === "connected").length;
  const showShop = v.settings.showBusinessInToday && v.revenue.length > 0;
  const today = m.timed;
  const nextToday = today.find((e) => parse(e.start) > now);

  return (
    <Screen background={J.ground} onRefresh={() => setRefresh((n) => n + 1)}>
      {header}
      {loading ? (
        <JarvisSkeleton orb={orb} />
      ) : (
        <Animated.View entering={FadeIn.duration(260)}>
          <View style={{ alignItems: "center" }}>
            <JarvisOrb size={orb} />
            <Clock next={m.ne ? { title: m.ne.title, start: m.ne.start } : undefined} />
          </View>

          <JHeading meta="Live">Gauges</JHeading>
          <View style={{ flexDirection: "row", gap: 4 }}>
            <Gauge
              to="money"
              title="Spend"
              value={m.budget.spent}
              max={m.budget.total}
              centre={pct(m.budget.spent, m.budget.total)}
              caption={m.budget.total ? `${money(m.budget.spent, true)}/${money(m.budget.total, true)}` : "no budget"}
              a11y={`Month spend ${money(m.budget.spent, true)} of ${money(m.budget.total, true)} budget. Opens Money`}
              color={m.budget.spent > m.budget.total ? J.coral : J.teal}
            />
            <Gauge
              to="health"
              title="Steps"
              value={m.st?.steps ?? 0}
              max={STEP_GOAL}
              centre={pct(m.st?.steps ?? 0, STEP_GOAL)}
              caption={m.st ? m.st.steps.toLocaleString("en-GB") : "no data"}
              a11y={`Steps today ${m.st?.steps ?? 0} of ${STEP_GOAL} goal. Opens Health`}
              color={J.heather}
            />
            <Gauge to="tasks" title="Tasks" value={m.tk.done} max={m.tk.total} centre={`${m.tk.done}/${m.tk.total}`} caption="done today" a11y={`${m.tk.done} of ${m.tk.total} tasks done today. Opens Tasks`} />
            <Gauge
              to="inbox"
              title="Replies"
              value={m.rp.waiting}
              max={m.rp.total}
              centre={String(m.rp.waiting)}
              caption="need reply"
              a11y={`${m.rp.waiting} inbox items need a reply. Opens Inbox`}
              color={m.rp.waiting ? J.warn : J.teal}
            />
          </View>

          <JHeading meta={`${connected}/${v.connections.length} on`}>Systems</JHeading>
          <SystemsFeed items={v.connections} now={now} />

          <JHeading>Lanes</JHeading>
          <View style={{ gap: 10 }}>
            <Panel to="money" title="Money" label={`Cash ${money(m.cash.total)}, spent ${money(m.spend30, true)} in 30 days`} source={m.cash.sources}>
              <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
                <Stat big value={money(m.cash.total, true)} note={`In ${m.cash.count} ${m.cash.count === 1 ? "account" : "accounts"}`} />
                <View style={{ alignItems: "flex-end" }}>
                  <Sparkline values={m.series} width={Math.min(140, full - 190)} height={40} color={J.teal} area />
                  <JLabel style={{ marginTop: 4 }}>{`30d spend ${money(m.spend30, true)}`}</JLabel>
                </View>
              </View>
            </Panel>

            <Panel to="calendar" title="Schedule" label={today.length ? `${today.length} events today` : "Nothing in the diary today"} source={today[0]?.source}>
              {today.length ? (
                <>
                  <TimeTrack events={today} now={now} />
                  <JText size={13} color={J.text} lines={1} style={{ marginTop: 8 }}>
                    {nextToday ? `${time(nextToday.start)}  ${nextToday.title}` : "Everything in the diary is done for today"}
                  </JText>
                </>
              ) : (
                <JText>Nothing is in the diary today.</JText>
              )}
            </Panel>

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              <Panel to={m.trip ? `plans/${m.trip.trip.id}` : "plans"} title="Plans" width={half} label={m.trip ? `${m.trip.trip.title} in ${m.trip.days} days` : "No trips planned"} source={m.trip?.source}>
                {m.trip ? (
                  <Stat big value={m.trip.days > 0 ? `${m.trip.days}d` : "Now"} note={`${m.trip.trip.title}, ${relDay(m.trip.trip.start)}`} />
                ) : (
                  <JText>No trips planned</JText>
                )}
              </Panel>
              <Panel
                to="deliveries"
                title="Deliveries"
                width={half}
                label={`${m.del.count} in transit`}
                source={m.del.next?.source}
              >
                <Stat value={m.del.count} note={m.del.next ? `Next: ${m.del.next.retailer}, ${m.del.when}` : "Nothing in transit"} />
              </Panel>
              {showShop ? (
                <Panel to="business" title="Business" width={half} label={`Today's revenue ${money(m.rev.row?.revenue ?? 0, true)}`} source={["shopify", "etsy"]}>
                  <Stat value={money(m.rev.row?.revenue ?? 0, true)} note={`Today, ${m.rev.row?.orders ?? 0} orders`} />
                  <View style={{ marginTop: 6 }}>
                    <Sparkline values={m.rev.series} width={half - 26} height={28} color={J.heather} />
                  </View>
                </Panel>
              ) : null}
              {m.st ? (
                <Panel to="health" title="Health" width={half} label={`Slept ${hm(m.st.sleepMin)}, resting heart rate ${m.st.restingHr}`} source="apple-health">
                  <Stat value={hm(m.st.sleepMin)} note="Sleep last night" />
                  <View style={{ marginTop: 8 }}>
                    <JNum size={16} color={J.heather}>
                      {m.st.restingHr} <JText size={11}>bpm resting</JText>
                    </JNum>
                  </View>
                </Panel>
              ) : null}
            </View>
          </View>

          <JLabel style={{ marginTop: 26, textAlign: "center" }} color={J.muted}>
            Demo data. Nothing is connected.
          </JLabel>
        </Animated.View>
      )}
    </Screen>
  );
}
