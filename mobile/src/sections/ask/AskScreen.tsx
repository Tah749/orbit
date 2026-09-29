import { useCallback, useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowUp } from "phosphor-react-native";
import { ask, suggestions, type Answer, type Cite } from "@orbit/sections/ask/engine";
import { time } from "@orbit/time";
import { db } from "../../store";
import { useTheme } from "../../theme";
import { Button, GUTTER, Label, Source, Text } from "../../ui";
import { Orb } from "./Orb";
import { routeFor } from "./links";

type Exchange = { id: number; q: string; a: Answer; at: string };

/** The conversation lasts for the session, so it is still here after a look at another tab. */
let thread: Exchange[] = [];

function Sources({ cites, onOpen }: { cites: Cite[]; onOpen: (href: string) => void }) {
  const { c } = useTheme();
  const [all, setAll] = useState(false);
  const shown = all ? cites : cites.slice(0, 4);
  return (
    <View style={{ marginTop: 14 }}>
      <Label>{cites.length === 1 ? "Source" : `Sources · ${cites.length}`}</Label>
      <View style={{ marginTop: 8, borderTopWidth: 1, borderTopColor: c.line }}>
        {shown.map((ci, i) => (
          <Pressable
            key={`${ci.href}-${i}`}
            onPress={() => onOpen(ci.href)}
            accessibilityRole="link"
            accessibilityLabel={`${ci.title}, open`}
            style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 12, minHeight: 48, paddingVertical: 9, paddingHorizontal: 2, borderBottomWidth: 1, borderBottomColor: c.line, backgroundColor: pressed ? c.soft : "transparent" })}
          >
            <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
              <Text size={13.5} lines={1}>
                {ci.title}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Source id={ci.source} />
                {ci.meta ? (
                  <Text size={12} tone="muted" lines={1} style={{ flexShrink: 1 }}>
                    {ci.meta}
                  </Text>
                ) : null}
              </View>
            </View>
            {ci.date ? (
              <Text size={11.5} font="mono" tone="faint" num>
                {ci.date}
              </Text>
            ) : null}
          </Pressable>
        ))}
      </View>
      {cites.length > shown.length ? (
        <Pressable onPress={() => setAll(true)} accessibilityRole="button" style={{ minHeight: 40, justifyContent: "center" }}>
          <Text size={12.5} tone="muted" style={{ textDecorationLine: "underline" }}>
            Show {cites.length - shown.length} more
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function Suggestions({ items, onPick }: { items: string[]; onPick: (q: string) => void }) {
  const { c } = useTheme();
  return (
    <View style={{ borderTopWidth: 1, borderTopColor: c.line }}>
      {items.map((s) => (
        <Pressable
          key={s}
          onPress={() => onPick(s)}
          accessibilityRole="button"
          style={({ pressed }) => ({ minHeight: 48, justifyContent: "center", paddingVertical: 10, paddingHorizontal: 2, borderBottomWidth: 1, borderBottomColor: c.line, backgroundColor: pressed ? c.soft : "transparent" })}
        >
          <Text size={15}>{s}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function ExchangeView({ ex, onPick, onOpen }: { ex: Exchange; onPick: (q: string) => void; onOpen: (href: string) => void }) {
  const { c } = useTheme();
  return (
    <View style={{ paddingVertical: 18, gap: 18 }}>
      <View style={{ alignItems: "flex-end" }}>
        <View style={{ maxWidth: "86%", backgroundColor: c.soft, borderRadius: 10, paddingHorizontal: 13, paddingVertical: 10 }}>
          <Text size={15}>{ex.q}</Text>
        </View>
        <Text size={11} font="mono" tone="faint" style={{ marginTop: 5 }}>
          Asked at {time(ex.at)}
        </Text>
      </View>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ paddingTop: 2 }}>
          <Orb size={22} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text size={15} style={{ lineHeight: 23 }}>
            {ex.a.text}
          </Text>
          {ex.a.cites.length > 0 ? <Sources cites={ex.a.cites} onOpen={onOpen} /> : null}
          {!ex.a.matched ? (
            <View style={{ marginTop: 16 }}>
              <Label style={{ marginBottom: 6 }}>You could ask</Label>
              <Suggestions items={suggestions.slice(0, 4)} onPick={onPick} />
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export default function AskScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ q?: string }>();
  const [items, setItems] = useState<Exchange[]>(() => thread);
  const [draft, setDraft] = useState("");
  const scroll = useRef<ScrollView>(null);
  const lastY = useRef(0);
  const scrollNext = useRef(false);

  const submit = useCallback((text: string) => {
    const q = text.trim();
    if (!q) return;
    thread = [...thread, { id: Date.now() + Math.random(), q, a: ask(q, db.get()), at: new Date().toISOString() }];
    scrollNext.current = true;
    setItems(thread);
    setDraft("");
  }, []);

  // /ask?q=<question> asks it on arrival.
  const linked = typeof params.q === "string" ? params.q : undefined;
  useEffect(() => {
    if (linked && thread[thread.length - 1]?.q !== linked.trim()) submit(linked);
  }, [linked, submit]);

  const open = (href: string) => router.push(routeFor(href) as never);
  const clear = () => {
    thread = [];
    setItems([]);
  };
  const canSend = draft.trim().length > 0;

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1, backgroundColor: c.paper }}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: GUTTER, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: c.line, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Label style={{ marginBottom: 8 }}>From your connected data</Label>
          <Text size={34} font="serif" style={{ lineHeight: 37, letterSpacing: -0.7 }} accessibilityRole="header">
            Ask Orbit
          </Text>
        </View>
        {items.length > 0 ? (
          <Button variant="ghost" size="sm" onPress={clear}>
            Clear conversation
          </Button>
        ) : null}
      </View>

      <ScrollView
        ref={scroll}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        contentContainerStyle={{ paddingHorizontal: GUTTER, paddingBottom: 24 }}
        onContentSizeChange={() => {
          if (!scrollNext.current) return;
          scrollNext.current = false;
          scroll.current?.scrollTo({ y: Math.max(0, lastY.current - 8), animated: true });
        }}
      >
        {items.length === 0 ? (
          <View style={{ paddingTop: 22 }}>
            <Text size={15} tone="muted" style={{ lineHeight: 22 }}>
              Ask in your own words. Orbit answers from the sample data in this app and lists the items it used, so you can check them. If it does not know, it says so.
            </Text>
            <Label style={{ marginTop: 28, marginBottom: 8 }}>Try asking</Label>
            <Suggestions items={suggestions} onPick={submit} />
          </View>
        ) : (
          <View accessibilityLabel="Conversation" accessibilityLiveRegion="polite">
            {items.map((ex, i) => (
              <View
                key={ex.id}
                onLayout={i === items.length - 1 ? (e) => (lastY.current = e.nativeEvent.layout.y) : undefined}
                style={{ borderTopWidth: i === 0 ? 0 : 1, borderTopColor: c.line }}
              >
                <ExchangeView ex={ex} onPick={submit} onOpen={open} />
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={{ borderTopWidth: 1, borderTopColor: c.line, backgroundColor: c.paper, paddingHorizontal: GUTTER, paddingTop: 10, paddingBottom: 10, flexDirection: "row", alignItems: "center", gap: 8 }}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={() => submit(draft)}
          placeholder="Ask about your day, money or plans"
          placeholderTextColor={c.faint}
          selectionColor={c.accent}
          accessibilityLabel="Ask Orbit a question"
          returnKeyType="send"
          blurOnSubmit={false}
          style={{ flex: 1, minHeight: 44, borderRadius: 7, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, paddingHorizontal: 12, fontFamily: "Geist_400Regular", fontSize: 15, color: c.ink }}
        />
        <Pressable
          onPress={() => submit(draft)}
          disabled={!canSend}
          accessibilityRole="button"
          accessibilityLabel="Ask"
          style={{ width: 44, height: 44, borderRadius: 7, backgroundColor: c.ink, alignItems: "center", justifyContent: "center", opacity: canSend ? 1 : 0.4 }}
        >
          <ArrowUp size={18} color={c.paper} weight="bold" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
