import { useMemo } from "react";
import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { X } from "phosphor-react-native";
import type { CalEvent } from "@orbit/data/calendar";
import { dayStart } from "@orbit/sections/calendar/lib";
import { parse } from "@orbit/time";
import { useTheme } from "../../src/theme";
import { db, newId } from "../../src/store";
import { IconButton, Page, Screen, toast } from "../../src/ui";
import { EventForm } from "../../src/sections/calendar/EventForm";
import { blankDraft, eventFields, type Draft } from "../../src/sections/calendar/draft";

export default function NewEvent() {
  const { c } = useTheme();
  const router = useRouter();
  const p = useLocalSearchParams<{ date?: string; start?: string; end?: string }>();
  const initial = useMemo(() => {
    const day = p.date && /^\d{4}-\d{2}-\d{2}$/.test(p.date) ? parse(p.date) : dayStart(new Date());
    const from = Number.isFinite(Number(p.start)) && p.start ? Number(p.start) : 9 * 60;
    const to = p.end && Number.isFinite(Number(p.end)) ? Number(p.end) : undefined;
    return blankDraft(day, from, to);
  }, [p.date, p.start, p.end]);

  const close = () => (router.canGoBack() ? router.back() : router.replace("/calendar"));
  const create = (d: Draft) => {
    const ev: CalEvent = { id: newId("ev"), ...eventFields(d), source: "manual" };
    db.insert("events", ev, "end");
    close();
    toast("Event added", { label: "Undo", run: () => db.remove("events", ev.id) });
  };

  return (
    <Screen>
      <Page
        eyebrow="Calendar"
        title="New event"
        actions={
          <IconButton label="Close" onPress={close}>
            <X size={20} color={c.ink} />
          </IconButton>
        }
      >
        <View>
          <EventForm initial={initial} submitLabel="Add event" onSubmit={create} onCancel={close} />
        </View>
      </Page>
    </Screen>
  );
}
