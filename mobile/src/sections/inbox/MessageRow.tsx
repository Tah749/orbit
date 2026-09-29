import { useRef } from "react";
import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import Swipeable, { type SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable";
import { Archive, Clock, Paperclip, Star, Trash, Tray } from "phosphor-react-native";
import { stamp } from "@orbit/time";
import type { Message } from "@orbit/data/mail";
import { useTheme } from "../../theme";
import { Source, Tag, Text } from "../../ui";
import { archive, remove, toInbox, toggleStar, unsnooze } from "./actions";
import { counterpart, isOutgoing, isSnoozed } from "./views";

function Panel({ bg, label, icon }: { bg: string; label: string; icon: React.ReactNode }) {
  const { c } = useTheme();
  return (
    <View style={{ width: 92, backgroundColor: bg, alignItems: "center", justifyContent: "center", gap: 4 }}>
      {icon}
      <Text size={12} font="sansMedium" style={{ color: c.paper }}>
        {label}
      </Text>
    </View>
  );
}

/** A message row. Swipe right to archive, left to snooze; the star sits at the bottom right. */
export function MessageRow({ m, showWhy, showFolder, onSnooze }: { m: Message; showWhy: boolean; showFolder: boolean; onSnooze: (m: Message) => void }) {
  const { c } = useTheme();
  const router = useRouter();
  const ref = useRef<SwipeableMethods>(null);
  const who = counterpart(m);
  const outgoing = isOutgoing(m);
  const unread = !m.read && !outgoing;
  const snoozed = isSnoozed(m);
  const folderTag = m.folder === "archive" ? "Archived" : m.folder === "sent" ? "Sent" : m.folder === "drafts" ? "Draft" : snoozed ? "Snoozed" : null;

  // What the right swipe does depends on where the message is.
  const primary = outgoing
    ? { label: "Delete", icon: <Trash size={20} color={c.paper} />, run: () => remove(m), bg: c.coral }
    : snoozed
      ? { label: "Unsnooze", icon: <Tray size={20} color={c.paper} />, run: () => unsnooze(m), bg: c.accent }
      : m.folder === "archive"
        ? { label: "Inbox", icon: <Tray size={20} color={c.paper} />, run: () => toInbox(m), bg: c.accent }
        : { label: "Archive", icon: <Archive size={20} color={c.paper} />, run: () => archive(m), bg: c.accent };

  return (
    <Swipeable
      ref={ref}
      friction={2}
      overshootLeft={false}
      overshootRight={false}
      leftThreshold={72}
      rightThreshold={72}
      renderLeftActions={() => <Panel bg={primary.bg} label={primary.label} icon={primary.icon} />}
      renderRightActions={outgoing ? undefined : () => <Panel bg={c.warn} label="Snooze" icon={<Clock size={20} color={c.paper} />} />}
      onSwipeableOpen={(dir) => {
        ref.current?.close();
        if (dir === "left") primary.run();
        else onSnooze(m);
      }}
    >
      <View style={{ backgroundColor: c.paper, borderBottomWidth: 1, borderBottomColor: c.line }}>
        <Pressable
          onPress={() => router.push(`/inbox/${m.id}` as never)}
          accessibilityRole="button"
          accessibilityLabel={`${unread ? "Unread. " : ""}${who.name}. ${m.subject}`}
          accessibilityActions={[
            { name: "activate", label: "Open" },
            { name: "archive", label: primary.label },
            ...(outgoing ? [] : [{ name: "snooze", label: "Snooze" }]),
            { name: "star", label: m.starred ? "Unstar" : "Star" },
          ]}
          onAccessibilityAction={(e) => {
            const n = e.nativeEvent.actionName;
            if (n === "archive") primary.run();
            else if (n === "snooze") onSnooze(m);
            else if (n === "star") toggleStar(m);
            else router.push(`/inbox/${m.id}` as never);
          }}
          style={({ pressed }) => ({ paddingVertical: 12, paddingLeft: 16, paddingRight: 12, backgroundColor: pressed ? c.soft : "transparent" })}
        >
          {unread ? <View accessibilityLabel="Unread" style={{ position: "absolute", left: 5, top: 20, width: 6, height: 6, borderRadius: 3, backgroundColor: c.accent }} /> : null}
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
            <Text size={14.5} font={unread ? "sansSemi" : "sans"} lines={1} style={{ flexShrink: 1 }}>
              {outgoing ? <Text size={14.5} tone="muted">{m.folder === "drafts" ? "Draft to " : "To "}</Text> : null}
              {who.name}
            </Text>
            <Source id={m.source} />
            <View style={{ marginLeft: "auto", flexDirection: "row", alignItems: "center", gap: 6 }}>
              {m.attachments?.length ? <Paperclip size={13} color={c.faint} /> : null}
              <Text size={11.5} font="mono" tone="faint" num>
                {stamp(m.date)}
              </Text>
            </View>
          </View>
          <Text size={13.5} font={unread ? "sansMedium" : "sans"} lines={1} style={{ marginTop: 2, paddingRight: 30 }}>
            {m.subject}
          </Text>
          <Text size={13} tone="muted" lines={1} style={{ marginTop: 2, paddingRight: 30 }}>
            {m.snippet}
          </Text>
          {(showWhy && m.why) || (showFolder && folderTag) ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6, paddingRight: 30 }}>
              {showFolder && folderTag ? <Tag>{folderTag}</Tag> : null}
              {showWhy && m.why ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 1 }}>
                  <View style={{ width: 5, height: 5, borderRadius: 3, borderWidth: 1, borderColor: c.accent }} />
                  <Text size={12} tone="muted" lines={1} style={{ flexShrink: 1 }}>
                    {m.why}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </Pressable>
        <Pressable
          onPress={() => toggleStar(m)}
          accessibilityRole="button"
          accessibilityLabel={m.starred ? `Unstar ${m.subject}` : `Star ${m.subject}`}
          accessibilityState={{ selected: m.starred }}
          hitSlop={4}
          style={{ position: "absolute", right: 2, bottom: 2, width: 40, height: 40, alignItems: "center", justifyContent: "center" }}
        >
          <Star size={17} weight={m.starred ? "fill" : "regular"} color={m.starred ? c.warn : c.faint} />
        </Pressable>
      </View>
    </Swipeable>
  );
}
