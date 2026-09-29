import { useEffect, useState } from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import { Newsreader_400Regular, Newsreader_400Regular_Italic, Newsreader_500Medium } from "@expo-google-fonts/newsreader";
import { Geist_400Regular, Geist_500Medium, Geist_600SemiBold } from "@expo-google-fonts/geist";
import { GeistMono_400Regular, GeistMono_500Medium } from "@expo-google-fonts/geist-mono";
import { ThemeProvider, useTheme } from "../src/theme";
import { hydrate, useHydrated } from "../src/store";
import { ToastHost } from "../src/ui";
import { Intro } from "../src/intro/Intro";

SplashScreen.preventAutoHideAsync().catch(() => {});

/** Plays once per cold start; module scope so it survives re-renders of the layout. */
let introPlayed = false;

function Shell() {
  const { c, mode } = useTheme();
  const [intro, setIntro] = useState(!introPlayed);
  return (
    <View style={{ flex: 1, backgroundColor: c.paper }}>
      <StatusBar style={mode === "dark" ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.paper }, animation: "slide_from_right" }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="compose" options={{ presentation: "modal" }} />
        <Stack.Screen name="event/new" options={{ presentation: "modal" }} />
      </Stack>
      <ToastHost />
      {intro ? (
        <Intro
          onDone={() => {
            introPlayed = true;
            setIntro(false);
          }}
        />
      ) : null}
    </View>
  );
}

export default function RootLayout() {
  const [fontsReady, fontError] = useFonts({
    Newsreader_400Regular,
    Newsreader_400Regular_Italic,
    Newsreader_500Medium,
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    GeistMono_400Regular,
    GeistMono_500Medium,
  });
  const hydrated = useHydrated();

  useEffect(() => {
    hydrate();
  }, []);

  const ready = (fontsReady || !!fontError) && hydrated;
  useEffect(() => {
    // The intro sits on the same ink as the native splash, so the hand-off is seamless.
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <Shell />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
