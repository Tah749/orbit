import { useState, type ReactNode } from "react";
import { View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { AirplaneTilt, EnvelopeSimple, Storefront, TrendUp, X } from "phosphor-react-native";
import { db, useDB, type DB } from "../store";
import { greeting, longDate, on, parse, relDay, shortDate, time, daysFrom } from "@orbit/time";
import { briefing, comingUp, eventsOn, needsYou, type Need, type Upcoming } from "@orbit/sections/today/derive";
import { Amount, Check, Empty, IconButton, Label, Page, Row, Screen, Section, Skeleton, SkeletonList, Source, Tag, Text, toast, useSimulatedLoad, List } from "../ui";
import { useTheme } from "../theme";
import { routeFor } from "./routes";
import { useNow } from "./useNow";

const all = (d: DB) => d;

/** Dismissed items last for the session, as on the web. */
const dismissed = new Set<string>();

const needIcon = { reply: EnvelopeSimple, checkin: AirplaneTilt, price: TrendUp, shop: Storefront } as const;

function completeTask(id: string, title: string) {
  db.patch("tasks", id, { done: true, doneAt: new Date().toISOString() });
  toast(`Done: ${title}`, { label: "Undo", run: () => db.patch("tasks", id, { done: false, doneAt: undefined }) });
}

function useGo() {
  const router = useRouter();
  return (href: string) => router.push(routeFor(href) as never);
}

/* Schedule ---------------------------------------------------------------------------------------- */

function untilLabel(min: number) {
  return min < 60 ? `in ${min} min` : `in ${Math.floor(min / 60)} h${min % 60 ? ` ${min % 60} min` : ""}`;
}

function Schedule({ v, now }: { v: DB; now: Date }) {
  const { c, fonts } = useTheme();
  const go = useGo();
  const events = eventsOn(v, 0);
  const allDay = events.filter((e) => e.allDay);
  const timed = events.filter((e) => !e.allDay);
  const nextIdx = timed.findIndex((e) => parse(e.start) > now);
  return (
    <Section title="Today's schedule" meta={timed.length ? `${timed.length} ${timed.length === 1 ? "event" : "events"}` : undefined}>
      {allDay.map((e) => (
        <Text key={e.id} size={13} tone="muted" style={{ marginBottom: 6 }}>
          All day · {e.title}
        </Text>
      ))}
      {timed.length ? (
        <List>
          {timed.map((e, i) => {
            const past = parse(e.end) <= now;
            const live = parse(e.start) <= now && !past;
            const until = Math.round((parse(e.start).getTime() - now.getTime()) / 60_000);
            const meta = [e.location, e.video && `${e.video} call`].filter(Boolean).join(" · ");
            return (
              <Row
                key={e.id}
                onPress={() => go(`calendar/${e.id}`)}
                label={`${e.title}, ${time(e.start)}`}
                minHeight={60}
                left={
                  <View style={{ width: 46 }}>
                    <Text size={12.5} font="mono" num tone={past ? "faint" : "ink"}>
                      {time(e.start)}
                    </Text>
                    <Text size={11} font="mono" num tone="faint">
                      {time(e.end)}
                    </Text>
                  </View>
                }
                right={live ? <Tag tone="accent">On now</Tag> : i === nextIdx && until > 0 && until <= 180 ? <Text size={11.5} font="mono" tone="muted">{untilLabel(until)}</Text> : null}
              >
                <Text size={14.5} tone={past ? "muted" : "ink"} lines={1} style={{ fontFamily: fonts.sans }}>
                  {e.title}
                </Text>
                {meta ? (
                  <Text size={12.5} tone="muted" lines={1} style={{ marginTop: 1 }}>
                    {meta}
                  </Text>
                ) : null}
                <View style={{ marginTop: 4 }}>
                  <Source id={e.source} color={c.faint} />
                </View>
              </Row>
            );
          })}
        </List>
      ) : (
        <List>
          <Empty title="A clear day">Nothing is in the diary today.</Empty>
        </List>
      )}
    </Section>
  );
}

/* Needs you --------------------------------------------------------------------------------------- */

function NeedsYou({ v, now, withShop }: { v: DB; now: Date; withShop: boolean }) {
  const { c } = useTheme();
  const go = useGo();
  const [hidden, setHidden] = useState<Set<string>>(() => new Set(dismissed));
  const items = needsYou(v, now, withShop).filter((n) => !hidden.has(n.key));
  const shown = items.slice(0, 7);

  const dismiss = (n: Need) => {
    if (n.messageId) {
      const id = n.messageId;
      db.patch("messages", id, { needsReply: false });
      toast("Marked as not needing a reply", { label: "Undo", run: () => db.patch("messages", id, { needsReply: true }) });
      return;
    }
    const hide = (on: boolean) => {
      if (on) dismissed.add(n.key);
      else dismissed.delete(n.key);
      setHidden(new Set(dismissed));
    };
    hide(true);
    toast("Dismissed", { label: "Undo", run: () => hide(false) });
  };

  return (
    <Section title="Needs you" meta={items.length ? `${items.length} ${items.length === 1 ? "thing" : "things"}` : undefined}>
      {shown.length ? (
        <List>
          {shown.map((n) => {
            const Icon = n.kind === "task" ? null : needIcon[n.kind];
            const late = n.due === "Overdue" || !!n.due?.endsWith("late");
            return (
              <Row
                key={n.key}
                onPress={() => go(n.href)}
                label={n.title}
                minHeight={64}
                left={
                  n.taskId ? (
                    <Check checked={false} label={`Mark "${n.kind === "checkin" ? "Check in" : n.title}" done`} onChange={() => completeTask(n.taskId!, n.title)} />
                  ) : Icon ? (
                    <Icon size={18} color={c.faint} />
                  ) : null
                }
                right={
                  <View style={{ alignItems: "flex-end", gap: 2 }}>
                    {n.due ? (
                      <Text size={11} font="mono" num tone={late ? "coral" : "faint"}>
                        {n.due}
                      </Text>
                    ) : null}
                    {n.kind !== "task" ? (
                      <IconButton label={n.kind === "reply" ? "Doesn't need a reply" : "Dismiss"} size={36} onPress={() => dismiss(n)}>
                        <X size={15} color={c.faint} />
                      </IconButton>
                    ) : null}
                  </View>
                }
              >
                <Text size={14.5}>{n.title}</Text>
                <Text size={13} tone="muted" lines={2} style={{ marginTop: 1 }}>
                  {n.reason}
                </Text>
                <View style={{ marginTop: 4 }}>
                  <Source id={n.source} />
                </View>
              </Row>
            );
          })}
        </List>
      ) : (
        <List>
          <Empty title="Nothing needs you">Replies, overdue tasks and anything time-sensitive will show up here.</Empty>
        </List>
      )}
      {items.length > shown.length ? (
        <Text size={12.5} tone="muted" style={{ marginTop: 8 }}>
          And {items.length - shown.length} more in Inbox and Tasks.
        </Text>
      ) : null}
    </Section>
  );
}

/* Coming up --------------------------------------------------------------------------------------- */

const kindLabel: Record<Upcoming["kind"], string> = { bill: "Bill", booking: "Booking", birthday: "Birthday", renewal: "Renewal", delivery: "Delivery" };

function ComingUp({ v }: { v: DB }) {
  const go = useGo();
  const items = comingUp(v, 1, 10).slice(0, 3);
  return (
    <Section title="Coming up" meta="Next 10 days">
      {items.length ? (
        <List>
          {items.map((it) => (
            <Row
              key={it.key}
              onPress={() => go(it.href)}
              label={`${kindLabel[it.kind]}: ${it.title}, ${relDay(it.date)}`}
              minHeight={60}
              left={
                <View style={{ width: 46 }}>
                  <Text size={12.5} tone="ink" font="sansMedium" lines={1}>
                    {daysFrom(it.date) < 2 ? relDay(it.date) : relDay(it.date).split(" ")[0]}
                  </Text>
                  <Text size={11} font="mono" tone="faint">
                    {shortDate(it.date)}
                  </Text>
                </View>
              }
              right={it.amount != null ? <Amount value={it.amount} size={13.5} /> : null}
            >
              <Text size={14.5} lines={1}>
                {it.title}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 3 }}>
                {it.meta ? (
                  <Text size={12.5} tone="muted" lines={1} style={{ flexShrink: 1 }}>
                    {it.meta}
                  </Text>
                ) : null}
                <Source id={it.source} />
              </View>
            </Row>
          ))}
        </List>
      ) : (
        <List>
          <Empty title="A quiet stretch">No bills, bookings, birthdays or renewals in the next 10 days.</Empty>
        </List>
      )}
    </Section>
  );
}

/* Skeleton ---------------------------------------------------------------------------------------- */

function MinimalSkeleton() {
  return (
    <View>
      <View style={{ gap: 10, paddingBottom: 18 }}>
        <Skeleton width={150} height={10} />
        <Skeleton width="80%" height={30} />
        <Skeleton width="55%" height={30} />
      </View>
      <View style={{ gap: 9, marginTop: 8, marginBottom: 26 }}>
        <Skeleton height={15} />
        <Skeleton height={15} />
        <Skeleton width="70%" height={15} />
      </View>
      <View style={{ marginBottom: 12 }}>
        <Skeleton width={120} height={13} />
      </View>
      <View style={{ marginBottom: 26 }}>
        <SkeletonList rows={3} />
      </View>
      <View style={{ marginBottom: 12 }}>
        <Skeleton width={90} height={13} />
      </View>
      <View style={{ marginBottom: 26 }}>
        <SkeletonList rows={3} />
      </View>
      <View style={{ marginBottom: 12 }}>
        <Skeleton width={90} height={13} />
      </View>
      <SkeletonList rows={3} />
    </View>
  );
}

/* Page -------------------------------------------------------------------------------------------- */

export function Minimal({ header }: { header: ReactNode }) {
  const { fonts } = useTheme();
  const v = useDB(all);
  const now = useNow();
  const [refresh, setRefresh] = useState(0);
  const loading = useSimulatedLoad("home-minimal", refresh);
  const lines = briefing(v, now);
  const name = v.settings.name.trim();

  return (
    <Screen onRefresh={() => setRefresh((n) => n + 1)}>
      {header}
      {loading ? (
        <MinimalSkeleton />
      ) : (
        <Animated.View entering={FadeIn.duration(260)}>
          <Page eyebrow={longDate(on(0))} title={`${greeting(now)}${name ? `, ${name}` : ""}.`}>
            {lines.length > 0 ? (
              <View style={{ marginBottom: 28 }}>
                <Text size={19} style={{ fontFamily: fonts.serif, lineHeight: 28 }}>
                  {lines.join(" ")}
                </Text>
                <Text size={12} tone="faint" style={{ marginTop: 10 }}>
                  Written from your connected sample data at {time(now.toISOString())}.
                </Text>
              </View>
            ) : null}
            <NeedsYou v={v} now={now} withShop={v.settings.showBusinessInToday} />
            <Schedule v={v} now={now} />
            <ComingUp v={v} />
            <Label tone="faint">Sample data. Nothing is connected.</Label>
          </Page>
        </Animated.View>
      )}
    </Screen>
  );
}
