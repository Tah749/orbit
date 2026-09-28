import type { Icon } from "@phosphor-icons/react";
import {
  EnvelopeSimple,
  CalendarBlank,
  Tray,
  CalendarDots,
  Bank,
  ChartLineUp,
  AirplaneTilt,
  Heartbeat,
} from "@phosphor-icons/react";

export type IntegrationStatus = "Planned" | "In development" | "Coming soon";

/** Edit statuses here. Nothing on the site claims an integration is live. */
export const integrations: { name: string; detail: string; icon: Icon; status: IntegrationStatus }[] = [
  { name: "Gmail", detail: "Email", icon: EnvelopeSimple, status: "In development" },
  { name: "Google Calendar", detail: "Calendar", icon: CalendarBlank, status: "In development" },
  { name: "Outlook", detail: "Email", icon: Tray, status: "Planned" },
  { name: "Microsoft Calendar", detail: "Calendar", icon: CalendarDots, status: "Planned" },
  { name: "Banking", detail: "Accounts and bills", icon: Bank, status: "Coming soon" },
  { name: "Investments", detail: "Portfolios", icon: ChartLineUp, status: "Planned" },
  { name: "Travel", detail: "Flights and stays", icon: AirplaneTilt, status: "Coming soon" },
  { name: "Fitness", detail: "Activity and sleep", icon: Heartbeat, status: "Planned" },
];
