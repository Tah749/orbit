import { Suspense, lazy, useEffect, useState } from "react";
import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { Footer } from "./components/Footer";
import { PlaceholderPage } from "./components/PlaceholderPage";

const BelowFold = lazy(() => import("./components/BelowFold"));

/** Tiny hash router: "#/privacy" style routes are pages, plain "#anchor" hashes are in-page links. */
function useRoute() {
  const read = () => (window.location.hash.startsWith("#/") ? window.location.hash.slice(2) : "");
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const onHash = () => {
      const next = read();
      setRoute((prev) => {
        if (prev !== next) window.scrollTo(0, 0);
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
