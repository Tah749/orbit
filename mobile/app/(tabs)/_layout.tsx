import { Tabs } from "expo-router";
import { CalendarBlank, ChatCircleText, DotsThree, SunHorizon, Tray, Wallet } from "phosphor-react-native";
import type { Icon } from "phosphor-react-native";
import { useTheme } from "../../src/theme";

const tab = (Ico: Icon) =>
  function TabIcon({ color, focused }: { color: import("react-native").ColorValue; focused: boolean }) {
    return <Ico size={23} color={color as string} weight={focused ? "fill" : "regular"} />;
  };

export default function TabsLayout() {
  const { c, fonts } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.ink,
        tabBarInactiveTintColor: c.faint,
        tabBarStyle: { backgroundColor: c.paper, borderTopColor: c.line, borderTopWidth: 1, elevation: 0, shadowOpacity: 0 },
        tabBarLabelStyle: { fontFamily: fonts.sansMedium, fontSize: 10.5 },
        sceneStyle: { backgroundColor: c.paper },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: tab(SunHorizon) }} />
      <Tabs.Screen name="ask" options={{ title: "Ask", tabBarIcon: tab(ChatCircleText) }} />
      <Tabs.Screen name="inbox" options={{ title: "Inbox", tabBarIcon: tab(Tray) }} />
      <Tabs.Screen name="calendar" options={{ title: "Calendar", tabBarIcon: tab(CalendarBlank) }} />
      <Tabs.Screen name="money" options={{ title: "Money", tabBarIcon: tab(Wallet) }} />
      <Tabs.Screen name="more" options={{ title: "More", tabBarIcon: tab(DotsThree) }} />
    </Tabs>
  );
}
