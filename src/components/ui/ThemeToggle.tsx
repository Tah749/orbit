import { Moon, Sun } from "@phosphor-icons/react";
import { setMode, useMode } from "../../lib/theme";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const mode = useMode();
  const next = mode === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      onClick={() => setMode(next)}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      className={`grid size-10 place-items-center rounded-full text-muted transition-colors hover:bg-soft hover:text-ink ${className}`}
    >
      {mode === "dark" ? <Sun size={18} weight="bold" /> : <Moon size={18} weight="bold" />}
    </button>
  );
}
