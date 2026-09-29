/** Pure formatting helpers shared by the web app and the mobile app. */

const gbp = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });
const gbp0 = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 });

export const money = (n: number, whole = false) => (whole ? gbp0 : gbp).format(n);

export type Tone = "neutral" | "accent" | "info" | "warn" | "coral";
