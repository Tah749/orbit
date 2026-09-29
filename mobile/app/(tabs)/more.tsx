import { useRouter } from "expo-router";
import { AddressBook, CheckSquareOffset, Folders, GearSix, Heartbeat, Package, Storefront, Suitcase } from "phosphor-react-native";
import type { Icon } from "phosphor-react-native";
import { Label, List, Page, Row, Screen, Text } from "../../src/ui";
import { useTheme } from "../../src/theme";

/** The sections without a tab. Labels match src/orbit/sections.ts. */
const items: { label: string; path: string; icon: Icon }[] = [
  { label: "Tasks", path: "/tasks", icon: CheckSquareOffset },
  { label: "Business", path: "/business", icon: Storefront },
  { label: "Plans", path: "/plans", icon: Suitcase },
  { label: "Deliveries", path: "/deliveries", icon: Package },
  { label: "Health", path: "/health", icon: Heartbeat },
  { label: "People", path: "/people", icon: AddressBook },
  { label: "Life admin", path: "/admin", icon: Folders },
  { label: "Settings", path: "/settings", icon: GearSix },
];

export default function More() {
  const router = useRouter();
  const { c } = useTheme();
  return (
    <Screen>
      <Page eyebrow="Orbit" title="More">
        <List>
          {items.map(({ label, path, icon: Ico }) => (
            <Row key={path} chevron left={<Ico size={20} color={c.faint} />} onPress={() => router.push(path as never)} label={label}>
              <Text size={15}>{label}</Text>
            </Row>
          ))}
        </List>
        <Label style={{ marginTop: 28, textAlign: "center" }}>Sample data. Nothing is connected.</Label>
      </Page>
    </Screen>
  );
}
