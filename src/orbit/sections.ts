import { lazy, type ComponentType } from "react";
import type { Icon } from "@phosphor-icons/react";
import {
  SunHorizon,
  ChatCircleText,
  Tray,
  CalendarBlank,
  CheckSquareOffset,
  Wallet,
  Storefront,
  Suitcase,
  Package,
  Heartbeat,
  AddressBook,
  Folders,
  GearSix,
} from "@phosphor-icons/react";

/**
 * Every section of the app. Each one lives in its own folder, `src/orbit/sections/<key>/`,
 * whose index.tsx default-exports the page. Sections are lazy so each ships as its own chunk.
 */
export type Section = {
  key: string;
  label: string;
  icon: Icon;
  group: "main" | "life" | "admin";
  /** Shown in the mobile tab bar. */
  tab?: boolean;
  page: ComponentType;
};

export const sections: Section[] = [
  { key: "today", label: "Today", icon: SunHorizon, group: "main", tab: true, page: lazy(() => import("./sections/today")) },
  { key: "ask", label: "Ask Orbit", icon: ChatCircleText, group: "main", page: lazy(() => import("./sections/ask")) },
  { key: "inbox", label: "Inbox", icon: Tray, group: "main", tab: true, page: lazy(() => import("./sections/inbox")) },
  { key: "calendar", label: "Calendar", icon: CalendarBlank, group: "main", tab: true, page: lazy(() => import("./sections/calendar")) },
  { key: "tasks", label: "Tasks", icon: CheckSquareOffset, group: "main", page: lazy(() => import("./sections/tasks")) },
  { key: "money", label: "Money", icon: Wallet, group: "life", tab: true, page: lazy(() => import("./sections/money")) },
  { key: "business", label: "Business", icon: Storefront, group: "life", page: lazy(() => import("./sections/business")) },
  { key: "plans", label: "Plans", icon: Suitcase, group: "life", page: lazy(() => import("./sections/plans")) },
  { key: "deliveries", label: "Deliveries", icon: Package, group: "life", page: lazy(() => import("./sections/deliveries")) },
  { key: "health", label: "Health", icon: Heartbeat, group: "life", page: lazy(() => import("./sections/health")) },
  { key: "people", label: "People", icon: AddressBook, group: "admin", page: lazy(() => import("./sections/people")) },
  { key: "admin", label: "Life admin", icon: Folders, group: "admin", page: lazy(() => import("./sections/admin")) },
  { key: "settings", label: "Settings", icon: GearSix, group: "admin", page: lazy(() => import("./sections/settings")) },
];

export const sectionByKey = (key: string) => sections.find((s) => s.key === key) ?? sections[0];
