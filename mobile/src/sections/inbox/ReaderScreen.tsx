import { useEffect, useState, type ReactNode } from "react";
import { Pressable, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Archive, ArrowBendUpLeft, ArrowRight, CheckSquareOffset, Clock, EnvelopeSimple, FileText, PencilSimple, Star, Trash, Tray } from "phosphor-react-native";
import { longDate, relDay, stamp, time } from "@orbit/time";
import { money } from "@orbit/format";
import type { Message } from "@orbit/data/mail";
import type { Ref } from "@orbit/data/sources";
import { useDB, type DB } from "../../store";
import { useTheme } from "../../theme";
import { Avatar, Button, Empty, IconButton, Label, Screen, Source, Tag, Text } from "../../ui";
import { Orb } from "../ask/Orb";
import { routeFor } from "../ask/links";
import { archive, makeTask, markRead, remove, toInbox, toggleRead, toggleStar, unsnooze } from "./actions";
import { SnoozeSheet } from "./SnoozeSheet";
import { counterpart, firstName, isOutgoing, isSnoozed, me } from "./views";

/** "today" and "tomorrow" read naturally mid-sentence; weekdays and dates keep their capitals. */
const when = (s: string) => relDay(s).replace(/^(Today|Tomorrow|Yesterday)$/, (w) => w.toLowerCase());

type Linked = { kind: string; title: string; meta?: string; path: string };
const bookingKind: Record<string, string> = { flight: "Flight", hotel: "Hotel", train: "Train", restaurant: "Table", event: "Tickets", car: "Car hire" };

function resolve(r: Ref, d: DB): Linked | null | undefined {
  switch (r.kind) {
    case "booking": {
      const b = d.bookings.find((x) => x.id === r.id);
      return b && { kind: bookingKind[b.kind] ?? "Booking", title: b.title, meta: `${relDay(b.start)}, ${time(b.start)}`, path: `plans/${b.id}` };
    }
    case "bill": {
      const b = d.bills.find((x) => x.id === r.id);
      return b && { kind: "Bill", title: `${b.name} · ${b.payee}`, meta: `${money(b.amount)} ${b.status === "paid" ? "paid" : `due ${when(b.due)}`}`, path: `money/bills/${b.id}` };
    }
    case "order": {
      const o = d.orders.find((x) => x.id === r.id);
      return o && { kind: "Delivery", title: `${o.retailer}: ${o.items[0]?.name ?? "order"}`, meta: o.status.replace(/-/g, " "), path: `deliveries/${o.id}` };
    }
    case "doc": {
      const x = d.docs.find((y) => y.id === r.id);
      return x && { kind: "Document", title: x.title, meta: x.expires ? `Renews ${when(x.expires)}` : undefined, path: `admin/${x.id}` };
    }
    case "event": {
      const e = d.events.find((x) => x.id === r.id);
      return e && { kind: "Event", title: e.title, meta: `${relDay(e.start)}, ${time(e.start)}`, path: `calendar/${e.id}` };
    }
    case "task": {
      const t = d.tasks.find((x) => x.id === r.id);
      return t && { kind: "Task", title: t.title, meta: t.due ? `Due ${when(t.due)}` : undefined, path: `tasks/${t.id}` };
    }
    case "contact": {
      const c = d.contacts.find((x) => x.id === r.id);
      return c && { kind: "Person", title: c.name, path: `people/${c.id}` };
    }
    default:
      return null;
  }
}

function LinkRow({ kind, title, meta, path, onOpen }: Linked & { onOpen: (p: string) => void }) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={() => onOpen(path)}
      accessibilityRole="link"
      accessibilityLabel={`${kind}: ${title}`}
      style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 12, minHeight: 48, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: pressed ? c.soft : "transparent" })}
    >
      <Label tone="faint" style={{ width: 68 }}>
        {kind}
      </Label>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text size={13.5} lines={1}>
          {title}
        </Text>
        {meta ? (
          <Text size={12} tone="muted" lines={1}>
            {meta}
          </Text>
        ) : null}
      </View>
      <ArrowRight size={14} color={c.faint} />
    </Pressable>
  );
}

function OrbitNote({ m, onOpen }: { m: Message; onOpen: (p: string) => void }) {
  const { c } = useTheme();
  const linked = useDB((d) => (m.links ?? []).map((r) => resolve(r, d)).filter((x): x is Linked => !!x));
  const tasks = useDB((d) => d.tasks.filter((t) => t.from?.kind === "message" && t.from.id === m.id));
  const rows: Linked[] = [
    ...linked,
    ...tasks.map((t) => ({ kind: t.done ? "Task, done" : "Task", title: t.title, meta: t.due ? `Due ${when(t.due)}` : undefined, path: `tasks/${t.id}` })),
  ];
  const line = m.why ?? (m.needsReply ? `${firstName(m.from)} is waiting for a reply.` : null);
  if (!line && !rows.length) return null;
  return (
    <View accessibilityLabel="Orbit note" style={{ marginTop: 20, borderRadius: 10, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface }}>
      <View style={{ flexDirection: "row", gap: 12, padding: 14 }}>
        <View style={{ paddingTop: 2 }}>
          <Orb size={18} />
        </View>
        <View style={{ flex: 1 }}>
          <Label>Orbit note</Label>
          <Text size={14} style={{ marginTop: 4 }}>
            {line ? line.replace(/([^.])$/, "$1.") : `Connected to ${rows.length === 1 ? "one item" : `${rows.length} items`} in Orbit.`}
          </Text>
        </View>
      </View>
      {rows.map((r) => (
        <View key={r.path} style={{ borderTopWidth: 1, borderTopColor: c.line }}>
          <LinkRow {...r} onOpen={onOpen} />
        </View>
      ))}
    </View>
  );
}

function Paragraphs({ text, size = 15, serif }: { text: string[]; size?: number; serif?: boolean }) {
  return (
    <View style={{ gap: 12 }}>
      {text.map((p, i) => (
        <Text key={i} size={size} font={serif ? "serif" : "sans"} style={{ lineHeight: Math.round(size * 1.62) }}>
          {p}
        </Text>
      ))}
    </View>
  );
}

function Replies({ m, onOpen }: { m: Message; onOpen: (id: string) => void }) {
  const { c } = useTheme();
  const replies = useDB((d) => d.messages.filter((x) => x.replyTo === m.id && x.folder === "sent").sort((a, b) => a.date.localeCompare(b.date)));
  if (!replies.length) return null;
  return (
    <View style={{ marginTop: 28, borderTopWidth: 1, borderTopColor: c.line, paddingTop: 16 }}>
      <Label>Your {replies.length === 1 ? "reply" : "replies"}</Label>
      {replies.map((r) => (
        <Pressable key={r.id} onPress={() => onOpen(r.id)} accessibilityRole="link" style={{ marginTop: 12, gap: 4 }}>
          <Text size={12.5} tone="muted">
            You, {when(r.date)} at {time(r.date)}
          </Text>
          <Paragraphs text={r.body} size={14} />
        </Pressable>
      ))}
    </View>
  );
}

export default function ReaderScreen() {
  const { c, fonts } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const m = useDB((d) => d.messages.find((x) => x.id === id));
  const contact = useDB((d) => (m ? d.contacts.find((x) => x.email && x.email.toLowerCase() === m.from.email.toLowerCase()) : undefined));
  const original = useDB((d) => (m?.replyTo ? d.messages.find((x) => x.id === m.replyTo) : undefined));
  const [snoozing, setSnoozing] = useState<Message | undefined>();

  // Mark read when opened.
  useEffect(() => {
    if (m && !m.read && !isOutgoing(m)) markRead(m.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [m?.id]);

  const leave = () => (router.canGoBack() ? router.back() : router.replace("/inbox" as never));
  const open = (webPath: string) => router.push(routeFor(webPath) as never);

  if (!m) {
    return (
      <Screen back>
        <Empty title="That message isn't here" action={<Button onPress={leave}>Back to inbox</Button>}>
          It may have been deleted.
        </Empty>
      </Screen>
    );
  }

  const outgoing = isOutgoing(m);
  const snoozed = isSnoozed(m);
  const who = counterpart(m);
  const reply = () => router.push({ pathname: "/compose", params: { replyTo: m.id } } as never);
  const editDraft = () => router.push({ pathname: "/compose", params: { draft: m.id } } as never);
  const suggested = m.needsReply ? m.suggestedReply : undefined;

  let status: ReactNode = null;
  if (snoozed) status = <Tag tone="info">{`Snoozed until ${when(m.snoozedUntil!)}, ${time(m.snoozedUntil!)}`}</Tag>;
  else if (m.folder === "archive") status = <Tag>Archived</Tag>;
  else if (m.folder === "drafts") status = <Tag tone="warn">Draft</Tag>;
  else if (m.needsReply) status = <Tag tone="warn">Needs reply</Tag>;

  return (
    <Screen back>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <Source id={m.source} />
        {status}
      </View>
      <Text size={28} font="serif" accessibilityRole="header" style={{ marginTop: 10, lineHeight: 33, letterSpacing: -0.4 }}>
        {m.subject}
      </Text>

      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12, marginTop: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: c.line }}>
        <Avatar name={outgoing ? me.name : m.from.name} size={36} />
        <View style={{ flex: 1, minWidth: 0 }}>
          {contact ? (
            <Pressable onPress={() => router.push(`/people/${contact.id}` as never)} accessibilityRole="link" hitSlop={6}>
              <Text size={14} font="sansMedium" style={{ textDecorationLine: "underline", textDecorationColor: c.lineStrong }}>
                {m.from.name}
              </Text>
            </Pressable>
          ) : (
            <Text size={14} font="sansMedium">
              {outgoing ? "You" : m.from.name}
            </Text>
          )}
          <Text size={12.5} tone="muted" lines={1}>
            {m.from.email}
          </Text>
          <Text size={12.5} tone="muted" lines={1}>
            To {outgoing ? who.name : m.to.length === 1 && m.to[0].email === me.email ? "you" : m.to.map((p) => p.name).join(", ")}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text size={11.5} font="mono" tone="faint" num>
            {stamp(m.date)}
          </Text>
          <Text size={11.5} font="mono" tone="faint" num>
            {longDate(m.date).replace(/^\w+ /, "")}
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 12, marginHorizontal: -4, alignItems: "center" }}>
        {!outgoing ? (
          <Button size="sm" variant={m.needsReply ? "primary" : "outline"} icon={<ArrowBendUpLeft size={16} color={m.needsReply ? c.paper : c.ink} />} onPress={reply}>
            Reply
          </Button>
        ) : null}
        {!outgoing && m.folder === "inbox" && !snoozed ? (
          <Button size="sm" variant="ghost" icon={<Archive size={16} color={c.muted} />} onPress={() => (archive(m), leave())}>
            Archive
          </Button>
        ) : null}
        {!outgoing && (m.folder === "archive" || snoozed) ? (
          <Button size="sm" variant="ghost" icon={<Tray size={16} color={c.muted} />} onPress={() => (snoozed ? unsnooze(m) : toInbox(m))}>
            {snoozed ? "Unsnooze" : "Move to inbox"}
          </Button>
        ) : null}
        {!outgoing ? (
          <Button size="sm" variant="ghost" icon={<Clock size={16} color={c.muted} />} onPress={() => setSnoozing(m)}>
            Snooze
          </Button>
        ) : null}
        {!outgoing ? (
          <Button size="sm" variant="ghost" icon={<CheckSquareOffset size={16} color={c.muted} />} onPress={() => makeTask(m)}>
            Make a task
          </Button>
        ) : null}
        {m.folder === "drafts" ? (
          <Button size="sm" variant="primary" icon={<PencilSimple size={16} color={c.paper} />} onPress={editDraft}>
            Edit draft
          </Button>
        ) : null}
        {outgoing ? (
          <Button size="sm" variant="ghost" icon={<Trash size={16} color={c.muted} />} onPress={() => (remove(m), leave())}>
            Delete
          </Button>
        ) : null}
        <View style={{ flexDirection: "row", marginLeft: "auto" }}>
          {!outgoing ? (
            <IconButton label={m.read ? "Mark as unread" : "Mark as read"} size={40} onPress={() => toggleRead(m)}>
              <EnvelopeSimple size={18} weight={m.read ? "regular" : "fill"} color={c.muted} />
            </IconButton>
          ) : null}
          <IconButton label={m.starred ? "Unstar" : "Star"} size={40} onPress={() => toggleStar(m)}>
            <Star size={18} weight={m.starred ? "fill" : "regular"} color={m.starred ? c.warn : c.muted} />
          </IconButton>
        </View>
      </View>

      {!outgoing ? <OrbitNote m={m} onOpen={open} /> : null}

      {original ? (
        <Pressable onPress={() => router.push(`/inbox/${original.id}` as never)} accessibilityRole="link" style={{ marginTop: 16 }}>
          <Text size={13} tone="muted">
            In reply to{" "}
            <Text size={13} style={{ textDecorationLine: "underline", textDecorationColor: c.lineStrong }}>
              {original.from.name}: {original.subject}
            </Text>
          </Text>
        </Pressable>
      ) : null}

      <View style={{ marginTop: 20 }}>
        <Paragraphs text={m.body} />
      </View>

      {m.attachments?.length ? (
        <View style={{ marginTop: 26 }}>
          <Label style={{ marginBottom: 8 }}>
            {m.attachments.length} attachment{m.attachments.length > 1 ? "s" : ""}
          </Label>
          <View style={{ borderTopWidth: 1, borderTopColor: c.line }}>
            {m.attachments.map((a) => (
              <View key={a.name} style={{ flexDirection: "row", alignItems: "center", gap: 12, minHeight: 48, borderBottomWidth: 1, borderBottomColor: c.line }}>
                <FileText size={18} color={c.faint} />
                <Text size={13.5} lines={1} style={{ flex: 1 }}>
                  {a.name}
                </Text>
                <Text size={11.5} font="mono" tone="faint">
                  {a.size}
                </Text>
              </View>
            ))}
          </View>
          <Text size={12} tone="faint" style={{ marginTop: 8 }}>
            Attachments are part of the sample data and can't be opened.
          </Text>
        </View>
      ) : null}

      {!outgoing ? (
        <>
          <Replies m={m} onOpen={(rid) => router.push(`/inbox/${rid}` as never)} />
          <View style={{ marginTop: 28, borderTopWidth: 1, borderTopColor: c.line, paddingTop: 16 }}>
            {suggested ? (
              <View style={{ marginBottom: 14 }}>
                <Label style={{ marginBottom: 8 }}>Suggested reply</Label>
                <View style={{ borderLeftWidth: 1, borderLeftColor: c.lineStrong, paddingLeft: 12 }}>
                  <Paragraphs text={suggested.split(/\n\s*\n/)} size={16} serif />
                </View>
              </View>
            ) : null}
            <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
              <Button variant={m.needsReply ? "primary" : "outline"} icon={<ArrowBendUpLeft size={16} color={m.needsReply ? c.paper : c.ink} />} onPress={reply}>
                {suggested ? "Edit and reply" : "Reply"}
              </Button>
            </View>
            <Text size={12} tone="faint" style={{ marginTop: 10, fontFamily: fonts.sans }}>
              Sample app: replies go to Sent, nothing is emailed.
            </Text>
          </View>
        </>
      ) : null}

      <SnoozeSheet
        message={snoozing}
        onClose={(done) => {
          setSnoozing(undefined);
          if (done) leave();
        }}
      />
    </Screen>
  );
}
