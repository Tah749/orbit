import { useState } from "react";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { db } from "../../store";
import { useTheme } from "../../theme";
import { Button, Field, Input, Screen, Text, Textarea } from "../../ui";
import { sendNew, sendReply } from "./actions";
import { bodyText, toText } from "./views";

type Seed = { id?: string; replyTo?: string; to: string; subject: string; body: string };

/** Prefill from the route: ?replyTo=<id> answers a message, ?draft=<id> carries on with a draft. */
function seedFrom(params: { replyTo?: string; draft?: string; to?: string; subject?: string; body?: string }): Seed {
  if (params.replyTo) {
    const m = db.find("messages", params.replyTo);
    if (m) {
      return {
        replyTo: m.id,
        to: toText([m.from]),
        subject: /^re:/i.test(m.subject) ? m.subject : `Re: ${m.subject}`,
        body: (m.needsReply ? m.suggestedReply : undefined) ?? "",
      };
    }
  }
  if (params.draft) {
    const m = db.find("messages", params.draft);
    if (m) return { id: m.id, to: toText(m.to), subject: m.subject === "(No subject)" ? "" : m.subject, body: bodyText(m) };
  }
  return { to: params.to ?? "", subject: params.subject ?? "", body: params.body ?? "" };
}

export default function ComposeScreen() {
  const { c } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ replyTo?: string; draft?: string; to?: string; subject?: string; body?: string }>();
  const [seed] = useState(() => seedFrom(params));
  const [to, setTo] = useState(seed.to);
  const [subject, setSubject] = useState(seed.subject);
  const [body, setBody] = useState(seed.body);
  const [tried, setTried] = useState(false);

  const dirty = !!(to.trim() || subject.trim() || body.trim());
  const missingTo = !to.trim();
  const close = () => (router.canGoBack() ? router.back() : router.replace("/inbox" as never));

  const send = () => {
    setTried(true);
    if (missingTo) return;
    const original = seed.replyTo ? db.find("messages", seed.replyTo) : undefined;
    // A reply keeps its link to the message it answers; anything else goes through the new-message path.
    if (original && body.trim() && subject === seed.subject && to === seed.to) sendReply(original, body);
    else sendNew({ id: seed.id, to, subject, body }, "sent");
    close();
  };
  const save = () => {
    sendNew({ id: seed.id, to, subject, body }, "drafts");
    close();
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, backgroundColor: c.paper }}>
      <Screen bottomInset={false}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: c.line }}>
          <Button variant="ghost" onPress={close}>
            Cancel
          </Button>
          <Text size={20} font="serif" accessibilityRole="header">
            {seed.id ? "Edit draft" : seed.replyTo ? "Reply" : "New message"}
          </Text>
          <Button variant="primary" onPress={send}>
            Send
          </Button>
        </View>
        <View style={{ gap: 16, paddingTop: 18 }}>
          <Field label="To" hint={tried && missingTo ? "Add someone to send this to." : "A name or an email address. Separate several with commas."}>
            <Input
              value={to}
              onChangeText={setTo}
              placeholder="priya@lumen.example"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              accessibilityLabel="To"
              style={tried && missingTo ? { borderColor: c.coral } : undefined}
            />
          </Field>
          <Field label="Subject">
            <Input value={subject} onChangeText={setSubject} accessibilityLabel="Subject" />
          </Field>
          <Field label="Message">
            <Textarea value={body} onChangeText={setBody} accessibilityLabel="Message" style={{ minHeight: 220 }} />
          </Field>
          <Text size={12.5} tone="muted">
            This is a sample app. Sending adds the message to Sent here; nothing is emailed to anyone.
          </Text>
          <Button variant="outline" onPress={save} disabled={!dirty}>
            Save draft
          </Button>
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}
