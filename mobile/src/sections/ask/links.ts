/**
 * Web section paths ("inbox/msg-priya", "calendar/ev-1") to mobile routes.
 * Cites and task origins carry the web path; this is the one place that knows the difference.
 */
export function routeFor(webPath: string): string {
  const [section, a] = webPath.split("/");
  switch (section) {
    case "inbox":
      return a ? `/inbox/${a}` : "/inbox";
    case "calendar":
      return a ? `/event/${a}` : "/calendar";
    case "plans":
      return a && a !== "trip" ? `/plans/${a}` : "/plans";
    case "deliveries":
      return a ? `/deliveries/${a}` : "/deliveries";
    case "people":
      return a ? `/people/${a}` : "/people";
    case "tasks":
      return a ? `/tasks?id=${a}` : "/tasks";
    case "ask":
      return "/ask";
    default:
      // money, business, health, admin, settings: the section's own screen.
      return `/${section}`;
  }
}
