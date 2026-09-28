import { Suspense, lazy, useEffect, useState } from "react";
import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { Footer } from "./components/Footer";
import { PlaceholderPage } from "./components/PlaceholderPage";
import { Orb } from "./components/ui/Logo";

const BelowFold = lazy(() => import("./components/BelowFold"));
const OrbitApp = lazy(() => import("./orbit/App"));
const Journey = lazy(() => import("./journey/Journey"));
const Story = lazy(() => import("./story/Story"));


/**
 * Tiny hash router. "#/privacy" style routes are pages, "#/app/<section>" is the Orbit app (sample data)
 * ("#app" is a short alias), "#/journey" and "#/story" are the 3D scroll experiences, and plain "#anchor" hashes are in-page links.
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

function AppFallback() {
  return (
    <div className="grid min-h-[100dvh] place-items-center bg-paper">
      <span role="status" aria-label="Loading Orbit" className="text-ink">
        <Orb className="size-10 animate-pulse" />
      </span>
    </div>
  );
}

export default function App() {
  const route = useRoute();
  // A deep link like /#faq targets content in the lazy chunk; scroll once it has rendered.
  useEffect(() => {
    const hash = window.location.hash;
    if (route || !hash || hash.length < 2 || hash.startsWith("#/")) return;
    let tries = 0;
    const id = window.setInterval(() => {
      const el = document.getElementById(hash.slice(1));
      if (el || ++tries > 40) {
        window.clearInterval(id);
        el?.scrollIntoView();
      }
    }, 50);
    return () => window.clearInterval(id);
  }, [route]);

  if (route === "app" || route.startsWith("app/")) {
    return (
      <Suspense fallback={<AppFallback />}>
        <OrbitApp />
      </Suspense>
    );
  }
  if (route === "journey") {
    return (
      <Suspense fallback={<div className="min-h-[100dvh] bg-paper" />}>
        <Journey />
      </Suspense>
    );
  }
  if (route === "story") {
    return (
      <Suspense fallback={<div className="min-h-[100dvh] bg-paper" />}>
        <Story />
      </Suspense>
    );
  }
  if (route) return <PlaceholderPage slug={route} />;

  return (
    <>
      <Navbar />
      <main id="main">
        <Hero />
        <Suspense fallback={<div className="min-h-[100dvh]" />}>
          <BelowFold />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
