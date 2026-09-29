import { useState } from "react";
import { View } from "react-native";
import { MagnifyingGlass, Plus } from "phosphor-react-native";
import { useRouter } from "expo-router";
import type { Contact } from "@orbit/data/life";
import { daysFrom, relDay } from "@orbit/time";
import { useDB } from "../../store";
import { Avatar, Button, Empty, IconButton, Input, Label, List, Page, Row, Screen, Section, Text, useSimulatedLoad, SkeletonList } from "../../ui";

export function nextBirthday(mmdd?: string) {
  if (!mmdd) return undefined;
  const [m, d] = mmdd.split("-").map(Number);
  const now = new Date();
  for (const y of [now.getFullYear(), now.getFullYear() + 1]) {
    const date = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const days = daysFrom(date);
    if (days >= 0) return { date, days };
  }
  return undefined;
}

export function spoke(s?: string) {
  if (!s) return "no recent contact";
  const n = -daysFrom(s);
  if (n <= 0) return "spoke today";
  if (n === 1) return "spoke yesterday";
  if (n < 14) return `spoke ${n} days ago`;
  if (n < 60) return `spoke ${Math.round(n / 7)} weeks ago`;
  return `spoke ${Math.round(n / 30)} months ago`;
}

export function PeopleSection() {
  const router = useRouter();
  const contacts = useDB((d) => d.contacts);
  const [search, setSearch] = useState("");
  const loading = useSimulatedLoad("people");

  const filtered = contacts.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())).sort((a, b) => {
    const aBday = nextBirthday(a.birthday);
    const bBday = nextBirthday(b.birthday);
    const aHasBday = aBday !== undefined;
    const bHasBday = bBday !== undefined;
    if (aHasBday && !bHasBday) return -1;
    if (!aHasBday && bHasBday) return 1;
    if (aHasBday && bHasBday) return aBday!.days - bBday!.days;
    return a.name.localeCompare(b.name);
  });

  return (
    <Screen back>
      <Page eyebrow="Relationships" title="People">
        {loading ? (
          <SkeletonList rows={8} avatar />
        ) : (
          <View style={{ gap: 16 }}>
            <Input placeholder="Search contacts" value={search} onChangeText={setSearch} />
            {filtered.length ? (
              <Section>
                <List>
                  {filtered.map((c) => {
                    const bday = nextBirthday(c.birthday);
                    return (
                      <Row
                        key={c.id}
                        onPress={() => router.push(`/people/${c.id}`)}
                        chevron
                        left={<Avatar name={c.name} size={36} />}
                      >
                        <View style={{ flex: 1 }}>
                          <Text size={14.5}>{c.name}</Text>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
                            <Text size={12.5} tone="muted">
                              {spoke(c.lastContact)}
                            </Text>
                            {bday && bday.days === 0 && <Text size={12.5} tone="coral">Birthday today</Text>}
                            {bday && bday.days < 7 && bday.days > 0 && <Text size={12.5} tone="warn">Birthday in {bday.days} days</Text>}
                          </View>
                        </View>
                      </Row>
                    );
                  })}
                </List>
              </Section>
            ) : (
              <Empty title="No contacts">Search for people to add to your contacts.</Empty>
            )}
          </View>
        )}
      </Page>
    </Screen>
  );
}
