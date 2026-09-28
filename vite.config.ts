import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";

// `vite build --mode standalone` inlines all JS, CSS and fonts into one index.html
// that opens straight from the file system (no server needed).
export default defineConfig(({ mode }) => {
  const standalone = mode === "standalone";
  return {
    // Relative asset paths so the build works from any folder or subpath (e.g. GitHub Pages /orbit/).
    base: "./",
    plugins: [react(), tailwindcss(), ...(standalone ? [viteSingleFile()] : [])],
    build: standalone ? { outDir: "dist-standalone", assetsInlineLimit: 100_000_000 } : {},
  };
});
