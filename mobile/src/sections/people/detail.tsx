import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useDB } from "../../store";
import { Avatar, Empty, Label, Page, Row, Screen, Section, Source, Text } from "../../ui";
import { nextBirthday, spoke } from "./index";

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function PeopleDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const contact = useDB((d) => d.contacts.find((c) => c.id === id));

  if (!contact) {
    return (
      <Screen back>
        <Page title="Person">
          <Empty title="Not found">This contact no longer exists.</Empty>
        </Page>
      </Screen>
    );
  }

  const bday = contact.birthday ? nextBirthday(contact.birthday) : undefined;
  const birthdayText = contact.birthday ? (() => {
    const [m, d] = contact.birthday.split("-").map(Number);
    return `${d} ${months[m - 1]}`;
  })() : null;

  const relationName = { family: "Family", partner: "Partner", friend: "Friend", work: "Work", home: "Home" }[contact.relation];

  return (
    <Screen back>
      <Page title={contact.name}>
        <View style={{ gap: 20 }}>
          <View style={{ alignItems: "center", paddingVertical: 12 }}>
            <Avatar name={contact.name} size={72} />
            <Text size={20} font="serif" style={{ marginTop: 16 }}>
              {contact.name}
            </Text>
            <Text size={12.5} tone="muted" style={{ marginTop: 4 }}>
              {relationName}
            </Text>
          </View>

          <Section title="Contact">
            {contact.email && (
              <Row>
                <View>
                  <Label>Email</Label>
                  <Text size={14} style={{ marginTop: 6 }}>
                    {contact.email}
                  </Text>
                </View>
              </Row>
            )}
            {contact.phone && (
              <Row>
                <View>
                  <Label>Phone</Label>
                  <Text size={14} style={{ marginTop: 6 }}>
                    {contact.phone}
                  </Text>
                </View>
              </Row>
            )}
          </Section>

          {birthdayText && (
            <Section title="Important dates">
              <Row>
                <View>
                  <Label>Birthday</Label>
                  <Text size={14} style={{ marginTop: 6 }}>
                    {birthdayText}
                  </Text>
                  {bday && (
                    <Text size={12.5} tone="muted" style={{ marginTop: 4 }}>
                      {bday.days === 0 ? "Today" : bday.days === 1 ? "Tomorrow" : `In ${bday.days} days`}
                    </Text>
                  )}
                </View>
              </Row>
            </Section>
          )}

          <Section title="History">
            <Row>
              <View>
                <Label>Last contact</Label>
                <Text size={14} style={{ marginTop: 6 }}>
                  {spoke(contact.lastContact)}
                </Text>
              </View>
            </Row>
          </Section>

          {contact.notes && (
            <Section title="Notes">
              <Text size={14} style={{ lineHeight: 20 }}>
                {contact.notes}
              </Text>
            </Section>
          )}

          <Section>
            <Row>
              <View style={{ gap: 4 }}>
                <Label>Source</Label>
                <Source id={contact.source} />
              </View>
            </Row>
          </Section>
        </View>
      </Page>
    </Screen>
  );
}
