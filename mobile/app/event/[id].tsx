import { useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { calendars } from "@orbit/data/calendar";
import { useTheme } from "../../src/theme";
import { db, useDB } from "../../src/store";
import { Button, Empty, Page, Screen, Skeleton, SkeletonList, toast, useSimulatedLoad } from "../../src/ui";
import { EventDetails } from "../../src/sections/calendar/EventDetails";
import { EventForm } from "../../src/sections/calendar/EventForm";
import { draftFrom, eventFields, type Draft } from "../../src/sections/calendar/draft";

export default function EventScreen() {
  const { c } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const e = useDB((d) => d.events.find((x) => x.id === id));
  const [editing, setEditing] = useState(false);
  const loading = useSimulatedLoad(`event-${id}`);

  const save = (d: Draft) => {
    if (!e) return;
    db.patch("events", e.id, eventFields(d));
    setEditing(false);
    toast("Changes saved");
  };
  const remove = () => {
    if (!e) return;
    const ev = e;
    db.remove("events", ev.id);
    if (router.canGoBack()) router.back();
    else router.replace("/calendar");
    toast("Event deleted", { label: "Undo", run: () => db.insert("events", ev, "end") });
  };

  if (!e && !loading)
    return (
      <Screen back>
        <Page eyebrow="Calendar" title="Event">
          <Empty title="That event isn't here any more">It may have been deleted.</Empty>
        </Page>
      </Screen>
    );

  const cal = e ? calendars.find((x) => x.id === e.calendar) : undefined;
  return (
    <Screen back>
      <Page eyebrow={cal?.name ?? "Calendar"} title={editing ? "Edit event" : e?.title ?? " "}>
        {loading || !e ? (
          <View style={{ gap: 18 }}>
            <View style={{ gap: 8 }}>
              <Skeleton width="70%" height={15} />
              <Skeleton width={70} height={12} />
            </View>
            <SkeletonList rows={4} />
          </View>
        ) : editing ? (
          <EventForm initial={draftFrom(e)} submitLabel="Save changes" onSubmit={save} onCancel={() => setEditing(false)} />
        ) : (
          <View style={{ gap: 28 }}>
            <EventDetails e={e} />
            <View style={{ flexDirection: "row", gap: 8, paddingTop: 20, borderTopWidth: 1, borderTopColor: c.line }}>
              <Button variant="danger" onPress={remove}>
                Delete
              </Button>
              <Button variant="primary" onPress={() => setEditing(true)} style={{ marginLeft: "auto" }}>
                Edit
              </Button>
            </View>
          </View>
        )}
      </Page>
    </Screen>
  );
}
