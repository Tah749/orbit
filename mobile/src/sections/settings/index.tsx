import { useState } from "react";
import { View } from "react-native";
import { db, useDB } from "../../store";
import { useTheme } from "../../theme";
import { useHomeMode } from "../../prefs";
import { sourceName } from "@orbit/data/sources";
import type { Connection } from "@orbit/data/connections";
import { Button, Label, List, Page, Row, Screen, Section, Segmented, Sheet, Source, Switch, Tag, Text, useSimulatedLoad, SkeletonList } from "../../ui";

const categories: Connection["category"][] = ["Email", "Calendars", "Banking", "Investments", "Business", "Health", "Tasks", "Deliveries", "Car"];

function Connections() {
  const list = useDB((d) => d.connections);

  return (
    <View style={{ gap: 16 }}>
      <Text size={13.5} tone="muted" style={{ lineHeight: 19 }}>
        This is a sample app: nothing here is linked to a real account. Connected sources show sample data; turning one off hides it from your briefing and from Ask Orbit.
      </Text>
      {categories.map((cat) => {
        const items = list.filter((c) => c.category === cat);
        if (!items.length) return null;
        return (
          <Section key={cat} title={cat}>
            <List>
              {items.map((c) => (
                <Row key={c.id}>
                  <View style={{ flex: 1 }}>
                    <Text size={14}>{sourceName[c.id]}</Text>
                    <Text size={12.5} tone="muted" style={{ marginTop: 4 }}>
                      {c.detail}
                    </Text>
                  </View>
                  {c.status === "coming-soon" ? (
                    <Tag>Coming soon</Tag>
                  ) : (
                    <Switch
                      label={`${sourceName[c.id]} connected`}
                      checked={c.status === "connected"}
                      onChange={(on) => {
                        db.patch("connections", c.id, { status: on ? "connected" : "available" });
                      }}
                    />
                  )}
                </Row>
              ))}
            </List>
          </Section>
        );
      })}
    </View>
  );
}

function Preferences() {
  const { pref, setPref, mode } = useTheme();
  const [homeMode, setHomeMode] = useHomeMode();

  return (
    <View style={{ gap: 20 }}>
      <Section title="Appearance">
        <Segmented items={["System", "Light", "Dark"] as const} value={pref === "system" ? "System" : pref === "light" ? "Light" : "Dark"} onChange={(v) => setPref(v === "System" ? "system" : v === "Light" ? "light" : "dark")} label="Theme" />
        <Text size={12.5} tone="muted" style={{ marginTop: 8 }}>
          Currently showing {mode === "light" ? "Light" : "Dark"} mode.
        </Text>
      </Section>
      <Section title="Home screen">
        <Segmented items={["Minimal", "Jarvis"] as const} value={homeMode === "minimal" ? "Minimal" : "Jarvis"} onChange={(v) => setHomeMode(v === "Minimal" ? "minimal" : "jarvis")} label="Home layout" />
        <Text size={12.5} tone="muted" style={{ marginTop: 8 }}>
          {homeMode === "minimal" ? "Show a simple list of sections." : "Show a detailed dashboard with live data."}
        </Text>
      </Section>
    </View>
  );
}

export function SettingsSection() {
  const loading = useSimulatedLoad("settings");
  const [showReset, setShowReset] = useState(false);

  return (
    <Screen back>
      <Page eyebrow="Orbit" title="Settings">
        {loading ? (
          <SkeletonList rows={8} />
        ) : (
          <View style={{ gap: 24 }}>
            <Section title="Connections">
              <Connections />
            </Section>
            <Preferences />
            <Section title="Data">
              <Text size={13.5} tone="muted" style={{ lineHeight: 19, marginBottom: 12 }}>
                Everything in this app is sample data kept in this browser only. There is no account and nothing is sent anywhere. Clearing your browser data removes it.
              </Text>
              <Button variant="danger" onPress={() => setShowReset(true)} full>
                Reset to sample data
              </Button>
            </Section>
            <Label style={{ textAlign: "center", marginTop: 8 }}>Sample data. Nothing is connected.</Label>
          </View>
        )}
      </Page>
      <ResetSheet open={showReset} onClose={() => setShowReset(false)} />
    </Screen>
  );
}

function ResetSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [confirmed, setConfirmed] = useState(false);

  const reset = () => {
    db.reset();
    setConfirmed(false);
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Reset data"
      footer={
        <>
          <Button variant="ghost" onPress={onClose}>
            Cancel
          </Button>
          <Button variant={confirmed ? "danger" : "outline"} onPress={reset} disabled={!confirmed} key="confirm">
            {confirmed ? "Reset" : "Confirm"}
          </Button>
        </>
      }
    >
      <View style={{ gap: 12 }}>
        <Text size={14}>This will erase all your changes and restore the sample data. This cannot be undone.</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Switch checked={confirmed} onChange={setConfirmed} label="I understand" />
          <Text size={13} tone="muted" style={{ flex: 1 }}>
            I understand this will erase all my changes
          </Text>
        </View>
      </View>
    </Sheet>
  );
}
