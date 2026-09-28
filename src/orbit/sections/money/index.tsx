import { go, useRoute } from "../../router";
import { Page, Tabs } from "../../ui";
import Overview from "./Overview";
import Transactions from "./Transactions";
import Bills from "./Bills";
import Investments from "./Investments";

type Tab = "overview" | "transactions" | "bills" | "investments";
const tabs: Tab[] = ["overview", "transactions", "bills", "investments"];

export default function MoneyPage() {
  const { rest } = useRoute();
  const tab: Tab = tabs.includes(rest[0] as Tab) ? (rest[0] as Tab) : "overview";
  return (
    <Page title="Money">
      <Tabs<Tab>
        label="Money"
        items={[
          ["overview", "Overview"],
          ["transactions", "Transactions"],
          ["bills", "Bills and subscriptions"],
          ["investments", "Investments"],
        ]}
        value={tab}
        onChange={(t) => go(t === "overview" ? "money" : `money/${t}`)}
        className="mb-8"
      />
      {tab === "overview" && <Overview />}
      {tab === "transactions" && <Transactions openId={rest[1]} />}
      {tab === "bills" && <Bills openId={rest[1]} />}
      {tab === "investments" && <Investments />}
    </Page>
  );
}
