import { View } from "react-native";
import { daysFrom, inDays, on } from "@orbit/time";
import type { Doc } from "@orbit/data/life";
import { useDB } from "../../store";
import { Label, List, Page, Row, Screen, Section, Source, Text, useSimulatedLoad, SkeletonList } from "../../ui";

const kindName: Record<string, string> = {
  passport: "Passport",
  licence: "Licence",
  insurance: "Insurance",
  mot: "MOT",
  tax: "Vehicle tax",
  "tv-licence": "TV Licence",
  warranty: "Warranty",
  tenancy: "Tenancy",
  health: "Health",
  other: "Other",
};

const renews = ["insurance", "tax", "tv-licence", "tenancy"];
const verb = (k: string) => (renews.includes(k) ? "Renews" : k === "mot" ? "Due" : "Expires");

const monthShort = new Intl.DateTimeFormat("en-GB", { month: "short" });
const soon = (d: Doc) => !!d.expires && daysFrom(d.expires) <= 14;

function left(days: number) {
  if (days < 0) return `${-days} ${days === -1 ? "day" : "days"} ago`;
  if (days <= 60) return inDays(on(days));
  if (days < 120) return `in ${Math.round(days / 7)} weeks`;
  if (days < 730) return `in ${Math.round(days / 30.4)} months`;
  return `in ${Math.floor(days / 365)} years`;
}

function DateBlock({ date }: { date?: string }) {
  if (!date) {
    return (
      <View style={{ width: 48, paddingTop: 2, alignItems: "center" }}>
        <Label tone="faint">None</Label>
      </View>
    );
  }
  const d = new Date(date);
  return (
    <View style={{ width: 48, alignItems: "center" }}>
      <Text size={20} font="serif" num>
        {d.getDate()}
      </Text>
      <Label style={{ marginTop: 4 }}>
        {monthShort.format(d)}
        {d.getFullYear() !== new Date().getFullYear() && `\n${d.getFullYear()}`}
      </Label>
    </View>
  );
}

function DocRow({ doc }: { doc: Doc }) {
  const days = doc.expires ? daysFrom(doc.expires) : undefined;
  return (
    <Row minHeight={64}>
      <DateBlock date={doc.expires} />
      <View style={{ flex: 1, marginLeft: 16 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
          <Text size={14.5} style={{ flex: 1 }}>
            {doc.title}
          </Text>
          {days !== undefined && (
            <Text size={12.5} num tone={soon(doc) ? "coral" : "muted"}>
              {left(days)}
            </Text>
          )}
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
          <Label>{kindName[doc.kind]}</Label>
          {doc.holder && <Text size={12.5} tone="muted">{doc.holder}</Text>}
          {doc.reference && <Text size={12.5} num tone="muted">{doc.reference}</Text>}
          <Source id={doc.source} />
        </View>
      </View>
    </Row>
  );
}

export function AdminSection() {
  const docs = useDB((d) => d.docs);
  const loading = useSimulatedLoad("admin");

  const sorted = [...docs].sort((a, b) => {
    const aDays = a.expires ? daysFrom(a.expires) : 999;
    const bDays = b.expires ? daysFrom(b.expires) : 999;
    return aDays - bDays;
  });

  const expiringSoon = sorted.filter((d) => d.expires && daysFrom(d.expires) <= 14);
  const upcoming = sorted.filter((d) => !d.expires || (daysFrom(d.expires) > 14 && daysFrom(d.expires) <= 90));
  const other = sorted.filter((d) => !d.expires || daysFrom(d.expires) > 90);

  return (
    <Screen back>
      <Page eyebrow="Life" title="Life admin">
        {loading ? (
          <SkeletonList rows={8} />
        ) : (
          <View style={{ gap: 20 }}>
            {expiringSoon.length > 0 && (
              <Section title="Due soon" meta={`${expiringSoon.length} item${expiringSoon.length !== 1 ? "s" : ""}`}>
                <List>
                  {expiringSoon.map((d) => (
                    <DocRow key={d.id} doc={d} />
                  ))}
                </List>
              </Section>
            )}
            {upcoming.length > 0 && (
              <Section title="Coming up" meta={`${upcoming.length} item${upcoming.length !== 1 ? "s" : ""}`}>
                <List>
                  {upcoming.map((d) => (
                    <DocRow key={d.id} doc={d} />
                  ))}
                </List>
              </Section>
            )}
            {other.length > 0 && (
              <Section title="Later" meta={`${other.length} item${other.length !== 1 ? "s" : ""}`}>
                <List>
                  {other.map((d) => (
                    <DocRow key={d.id} doc={d} />
                  ))}
                </List>
              </Section>
            )}
          </View>
        )}
      </Page>
    </Screen>
  );
}
