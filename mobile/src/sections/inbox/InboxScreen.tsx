import { useMemo, useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { MagnifyingGlass, PencilSimpleLine, X } from "phosphor-react-native";
import type { Message } from "@orbit/data/mail";
import { useDB } from "../../store";
import { useTheme } from "../../theme";
import { Button, Empty, Page, Screen, SkeletonList, Text, useSimulatedLoad, GUTTER } from "../../ui";
import { MessageRow } from "./MessageRow";
import { SnoozeSheet } from "./SnoozeSheet";
import { byDate, isSnoozed, matches, viewByKey, viewCount, views, type ViewKey } from "./views";

function Chip({ label, count, on, onPress }: { label: string; count?: number; on: boolean; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      style={{ minHeight: 40, paddingHorizontal: 12, borderRadius: 7, borderWidth: 1, borderColor: on ? c.ink : c.line, backgroundColor: on ? c.soft : "transparent", flexDirection: "row", alignItems: "center", gap: 6 }}
    >
      <Text size={13.5} font={on ? "sansMedium" : "sans"} tone={on ? "ink" : "muted"}>
        {label}
      </Text>
      {count ? (
        <Text size={11} font="mono" tone={on ? "ink" : "faint"} num>
          {count}
        </Text>
      ) : null}
    </Pressable>
  );
}

export default function InboxScreen() {
  const { c } = useTheme();
  const router = useRouter();
  const all = useDB((d) => d.messages);
  const [view, setView] = useState<ViewKey>("priority");
  const [q, setQ] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [snoozing, setSnoozing] = useState<Message | undefined>();
  const loading = useSimulatedLoad("inbox", refresh);

  const searching = q.trim().length > 0;
  const v = viewByKey(view);
  const list = useMemo(() => (searching ? all.filter((m) => matches(m, q)) : all.filter(v.test)).sort(byDate), [all, q, searching, v]);
  const unread = all.filter((m) => m.folder === "inbox" && !m.read && !isSnoozed(m)).length;

  return (
    <Screen onRefresh={() => setRefresh((n) => n + 1)}>
      <Page
        eyebrow={unread ? `${unread} unread` : "All read"}
        title="Inbox"
        actions={
          <Button variant="primary" size="sm" icon={<PencilSimpleLine size={16} color={c.paper} />} onPress={() => router.push("/compose" as never)}>
            Compose
          </Button>
        }
      >
        <View style={{ flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, borderRadius: 7, paddingLeft: 10, minHeight: 44 }}>
          <MagnifyingGlass size={16} color={c.faint} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search mail"
            placeholderTextColor={c.faint}
            selectionColor={c.accent}
            accessibilityLabel="Search mail by sender, subject or text"
            returnKeyType="search"
            autoCorrect={false}
            style={{ flex: 1, minHeight: 44, paddingHorizontal: 10, fontFamily: "Geist_400Regular", fontSize: 15, color: c.ink }}
          />
          {searching ? (
            <Pressable onPress={() => setQ("")} accessibilityRole="button" accessibilityLabel="Clear search" style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}>
              <X size={16} color={c.muted} />
            </Pressable>
          ) : null}
        </View>

        {!searching ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={{ marginTop: 14, marginHorizontal: -GUTTER }} contentContainerStyle={{ paddingHorizontal: GUTTER, gap: 8 }}>
            {views.map((x) => (
              <Chip key={x.key} label={x.label} count={viewCount(x, all)} on={x.key === view} onPress={() => setView(x.key)} />
            ))}
          </ScrollView>
        ) : (
          <Text size={11} font="mono" tone="faint" style={{ marginTop: 14, textTransform: "uppercase", letterSpacing: 1 }}>
            {list.length} in all mail
          </Text>
        )}

        <View style={{ marginTop: 14, marginHorizontal: -GUTTER }}>
          {loading ? (
            <View style={{ paddingHorizontal: GUTTER }}>
              <SkeletonList rows={7} />
            </View>
          ) : list.length === 0 ? (
            <View style={{ paddingHorizontal: GUTTER, borderTopWidth: 1, borderTopColor: c.line }}>
              {searching ? <Empty title="No mail matches that">{`Nothing from a sender, subject or message contains “${q.trim()}”.`}</Empty> : <Empty title={v.empty[0]}>{v.empty[1]}</Empty>}
            </View>
          ) : (
            <View style={{ borderTopWidth: 1, borderTopColor: c.line }}>
              {list.map((m) => (
                <MessageRow key={m.id} m={m} showWhy={!searching && m.folder === "inbox"} showFolder={searching || view === "all"} onSnooze={setSnoozing} />
              ))}
            </View>
          )}
        </View>
      </Page>
      <SnoozeSheet message={snoozing} onClose={() => setSnoozing(undefined)} />
    </Screen>
  );
}
