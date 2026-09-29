/** Maps the web app's section hrefs (as produced by derive.ts) to expo-router paths. */
export function routeFor(href: string): string {
  const [a, b] = href.split("/");
  switch (a) {
    case "tasks":
      return "/tasks";
    case "inbox":
      return b ? `/inbox/${b}` : "/(tabs)/inbox";
    case "calendar":
      return b ? `/event/${b}` : "/(tabs)/calendar";
    case "money":
      return "/(tabs)/money";
    case "plans":
      return b ? `/plans/${b}` : "/plans";
    case "deliveries":
      return b ? `/deliveries/${b}` : "/deliveries";
    case "people":
      return b ? `/people/${b}` : "/people";
    case "admin":
      return "/admin";
    case "business":
      return "/business";
    case "health":
      return "/health";
    case "settings":
      return "/settings";
    default:
      return "/(tabs)";
  }
}
