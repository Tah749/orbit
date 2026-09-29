import { Suspense, lazy, useEffect, useState } from "react";
import { PlaceholderPage } from "./components/PlaceholderPage";

const Story = lazy(() => import("./story/Story"));
const AppGate = lazy(() => import("./components/AppGate"));

/**
 * Tiny hash router. "#/app/<section>" is the Orbit app (sample data, behind a casual password gate; "#app" is a
 * short alias), "#/privacy" and "#/terms" are placeholder pages, and everything else is the phone story.
 */
function readRoute() {
  const h = window.location.hash;
  if (h === "#app") return "app";
  return h.startsWith("#/") ? h.slice(2) : "";
}

function useRoute() {
  const [route, setRoute] = useState(readRoute);
  useEffect(() => {
    const onHash = () => {
      const next = readRoute();
      setRoute((prev) => {
        const wasApp = prev.startsWith("app"), isApp = next.startsWith("app");
        if (prev !== next && !(wasApp && isApp)) window.scrollTo(0, 0);
        return next;
      });
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  return route;
}

export default function App() {
  const route = useRoute();
  if (route === "privacy" || route === "terms") return <PlaceholderPage slug={route} />;
  return (
    <Suspense fallback={<div className="min-h-[100dvh] bg-paper" />}>
      {route === "app" || route.startsWith("app/") ? <AppGate /> : <Story />}
    </Suspense>
  );
}
