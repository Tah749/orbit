import { useState } from "react";
import { db, useDB } from "../../store";
import { sourceName } from "../../data/sources";
import type { Connection } from "../../data/connections";
import { Button, Field, Input, Label, List, Page, Row, Section, Select, Source, Switch, Tabs, Tag, toast } from "../../ui";
import { stamp } from "../../time";
import { setMode, useMode } from "../../../lib/theme";

const categories: Connection["category"][] = ["Email", "Calendars", "Banking", "Investments", "Business", "Health", "Tasks", "Deliveries", "Car"];

function Connections() {
  const list = useDB((d) => d.connections);
  return (
    <div className="flex flex-col gap-8">
      <p className="max-w-[62ch] text-[13.5px] leading-relaxed text-muted">
        This is a sample app: nothing here is linked to a real account. Connected sources show sample data; turning one off hides it from your briefing
        and from Ask Orbit.
      </p>
      {categories.map((cat) => {
        const items = list.filter((c) => c.category === cat);
        if (!items.length) return null;
        return (
          <Section key={cat} title={cat}>
            <List>
              {items.map((c) => (
                <Row key={c.id}>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] text-ink">{sourceName[c.id]}</p>
                    <p className="truncate text-[12.5px] text-muted">
                      {c.detail}
                      {c.status === "connected" && c.lastSync ? ` · refreshed ${stamp(c.lastSync)}` : ""}
                    </p>
                  </div>
                  {c.status === "coming-soon" ? (
                    <Tag>Coming soon</Tag>
                  ) : (
                    <Switch
                      label={`${sourceName[c.id]} connected`}
                      checked={c.status === "connected"}
                      onChange={(on) => {
                        db.patch("connections", c.id, { status: on ? "connected" : "available" });
                        toast(on ? `${sourceName[c.id]} turned on` : `${sourceName[c.id]} turned off`);
                      }}
                    />
                  )}
                </Row>
              ))}
            </List>
          </Section>
        );
      })}
    </div>
  );
}

function Preferences() {
  const s = useDB((d) => d.settings);
  const mode = useMode();
  const set = (patch: Partial<typeof s>) => db.set("settings", { ...s, ...patch });
  return (
    <div className="grid max-w-[560px] gap-8">
      <Section title="You">
        <Field label="What should Orbit call you?">
          <Input value={s.name} onChange={(e) => set({ name: e.target.value })} />
        </Field>
      </Section>
      <Section title="Daily briefing">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Briefing time">
            <Input type="time" value={s.briefingTime} onChange={(e) => set({ briefingTime: e.target.value })} />
          </Field>
          <Field label="Digest">
            <Select value={s.digest} onChange={(e) => set({ digest: e.target.value as typeof s.digest })}>
              <option value="morning">Morning only</option>
              <option value="morning-evening">Morning and evening</option>
              <option value="off">Off</option>
            </Select>
          </Field>
        </div>
        <label className="mt-4 flex items-center justify-between gap-4 text-[14px]">
          Show the shop in Today
          <Switch label="Show the shop in Today" checked={s.showBusinessInToday} onChange={(v) => set({ showBusinessInToday: v })} />
        </label>
      </Section>
      <Section title="Quiet hours" meta="Only urgent things get through">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="From">
            <Input type="time" value={s.quietFrom} onChange={(e) => set({ quietFrom: e.target.value })} />
          </Field>
          <Field label="To">
            <Input type="time" value={s.quietTo} onChange={(e) => set({ quietTo: e.target.value })} />
          </Field>
        </div>
      </Section>
      <Section title="Appearance">
        <div className="flex gap-2">
          {(["light", "dark"] as const).map((m) => (
            <Button key={m} variant={mode === m ? "primary" : "outline"} onClick={() => setMode(m)}>
              {m === "light" ? "Light" : "Dark"}
            </Button>
          ))}
        </div>
        <label className="mt-4 flex items-center justify-between gap-4 text-[14px]">
          Weeks start on Monday
          <Switch label="Weeks start on Monday" checked={s.weekStartsMonday} onChange={(v) => set({ weekStartsMonday: v })} />
        </label>
      </Section>
    </div>
  );
}

function Data() {
  const [armed, setArmed] = useState(false);
  return (
    <div className="grid max-w-[560px] gap-8">
      <Section title="Where your data lives">
        <p className="text-[13.5px] leading-relaxed text-muted">
          Everything in this app is sample data kept in this browser only. There is no account and nothing is sent anywhere. Clearing your browser data removes
          it.
        </p>
      </Section>
      <Section title="Start again">
        <p className="mb-3 text-[13.5px] leading-relaxed text-muted">Put back the original sample data. Anything you've added or changed will be lost.</p>
        {armed ? (
          <div className="flex gap-2">
            <Button
              variant="danger"
              onClick={() => {
                db.reset();
                setArmed(false);
                toast("Sample data restored");
              }}
            >
              Yes, reset everything
            </Button>
            <Button variant="ghost" onClick={() => setArmed(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button variant="danger" onClick={() => setArmed(true)}>
            Reset sample data
          </Button>
        )}
      </Section>
      <div>
        <Label>Sources</Label>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
          <Source id="gmail" />
          <Source id="monzo" />
          <Source id="shopify" />
          <Source id="manual" />
        </div>
        <p className="mt-2 text-[12.5px] text-muted">Every item carries a small label like these, showing where it came from.</p>
      </div>
    </div>
  );
}

type Tab = "connections" | "preferences" | "data";

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("connections");
  return (
    <Page title="Settings">
      <Tabs<Tab>
        label="Settings"
        items={[
          ["connections", "Connections"],
          ["preferences", "Preferences"],
          ["data", "Your data"],
        ]}
        value={tab}
        onChange={setTab}
        className="mb-8"
      />
      {tab === "connections" && <Connections />}
      {tab === "preferences" && <Preferences />}
      {tab === "data" && <Data />}
    </Page>
  );
}
