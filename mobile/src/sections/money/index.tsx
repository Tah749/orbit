import { useCallback, useState } from "react";
import { ScrollView, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Page, Screen, Segmented, useSimulatedLoad } from "./kit";
import Overview, { OverviewSkeleton } from "./Overview";
import Transactions, { TransactionsSkeleton } from "./Transactions";
import Bills, { BillsSkeleton } from "./Bills";
import Investments, { InvestmentsSkeleton } from "./Investments";

const labels = ["Overview", "Transactions", "Bills", "Investments"] as const;
type Label = (typeof labels)[number];
const keys: Record<Label, string> = { Overview: "overview", Transactions: "transactions", Bills: "bills", Investments: "investments" };
const fromKey = (k?: string): Label => labels.find((l) => keys[l] === k) ?? "Overview";

export default function MoneyScreen() {
  // Deep links: /money?tab=bills&open=bill-electric
  const params = useLocalSearchParams<{ tab?: string; open?: string }>();
  const [tab, setTab] = useState<Label>(fromKey(params.tab));
  const [openId, setOpenId] = useState<string | undefined>(params.open);
  const [refresh, setRefresh] = useState(0);
  const loading = useSimulatedLoad(`money-${keys[tab]}`, refresh);
  const onRefresh = useCallback(() => setRefresh((n) => n + 1), []);

  /** Paths like "money/bills/<id>" from Orbit noticed and due-soon rows. */
  const openPath = (path: string) => {
    const [, t, id] = path.split("/");
    setTab(fromKey(t));
    setOpenId(id);
  };
  const close = () => setOpenId(undefined);

  return (
    <Screen onRefresh={onRefresh}>
      <Page title="Money">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24, flexGrow: 0 }}>
          <Segmented<Label>
            label="Money"
            items={labels}
            value={tab}
            onChange={(t) => {
              setTab(t);
              setOpenId(undefined);
            }}
          />
        </ScrollView>
        <View>
          {loading ? (
            tab === "Overview" ? <OverviewSkeleton /> : tab === "Transactions" ? <TransactionsSkeleton /> : tab === "Bills" ? <BillsSkeleton /> : <InvestmentsSkeleton />
          ) : tab === "Overview" ? (
            <Overview onOpen={openPath} onTab={(t) => setTab(fromKey(t))} />
          ) : tab === "Transactions" ? (
            <Transactions openId={openId} onOpen={setOpenId} onClose={close} />
          ) : tab === "Bills" ? (
            <Bills openId={openId} onOpen={setOpenId} onClose={close} />
          ) : (
            <Investments />
          )}
        </View>
      </Page>
    </Screen>
  );
}
