import { useMemo, useState } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { db, useDB } from "../../store";
import { categoryName, type Category, type Txn } from "../../data/money";
import { go } from "../../router";
import { Amount, Button, Empty, Facts, Field, List, money, Select, Sheet, Source, Tag, Textarea, toast } from "../../ui";
import { dayLabel, daysFrom, longDate, parse, relDay, time, ymd } from "../../time";
import { accountOf, TxnRow } from "./shared";

const allCategories = Object.keys(categoryName) as Category[];

function TxnSheet({ id }: { id?: string }) {
  const t = useDB((d) => (id ? d.txns.find((x) => x.id === id) : undefined));
  const accounts = useDB((d) => d.accounts);
  const close = () => go("money/transactions");
  const acc = t && accountOf(accounts, t.accountId);
  return (
    <Sheet
      open={!!id}
      onClose={close}
      title={t?.merchant ?? "Transaction"}
      footer={
        <Button variant="primary" onClick={close}>
          Done
        </Button>
      }
    >
      {t ? (
        <div className="flex flex-col gap-7">
          <div>
            <p className="font-serif text-[40px] leading-none tracking-[-0.02em]">
              <Amount value={t.amount} signed />
            </p>
            <p className="mt-2 flex items-center gap-2 text-[13px] text-muted">
              {t.pending ? <Tag>Pending</Tag> : <Tag tone="neutral">Settled</Tag>}
              {t.amount > 0 ? "Money in" : "Money out"}
            </p>
          </div>
          <Facts
            items={[
              ["When", `${longDate(t.date)}, ${time(t.date)}`],
              ["Account", acc ? `${acc.name} ··${acc.mask}` : "Unknown"],
              ["Source", acc ? <Source id={acc.institution} /> : "—"],
            ]}
          />
          <Field label="Category">
            <Select
              value={t.category}
              onChange={(e) => {
                const prev = t.category;
                const next = e.target.value as Category;
                db.patch("txns", t.id, { category: next });
                toast(`Moved to ${categoryName[next]}`, { label: "Undo", run: () => db.patch("txns", t.id, { category: prev }) });
              }}
            >
              {allCategories.map((c) => (
                <option key={c} value={c}>
                  {categoryName[c]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Note" hint="Only you see this. It's kept in this browser.">
            <Textarea value={t.note ?? ""} placeholder="What was this for?" onChange={(e) => db.patch("txns", t.id, { note: e.target.value || undefined })} />
          </Field>
        </div>
      ) : (
        <Empty title="Not found">This transaction isn't in your sample data any more.</Empty>
      )}
    </Sheet>
  );
}

export default function Transactions({ openId }: { openId?: string }) {
  const txns = useDB((d) => d.txns);
  const accounts = useDB((d) => d.accounts);
  const [q, setQ] = useState("");
  const [account, setAccount] = useState("all");
  const [shown, setShown] = useState(14);
  const [category, setCategory] = useState<"all" | Category>("all");

  const days = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = txns
      .filter((t) => account === "all" || t.accountId === account)
      .filter((t) => category === "all" || t.category === category)
      .filter((t) => !needle || t.merchant.toLowerCase().includes(needle) || (t.note ?? "").toLowerCase().includes(needle) || categoryName[t.category].toLowerCase().includes(needle))
      .sort((a, b) => b.date.localeCompare(a.date));
    const groups = new Map<string, Txn[]>();
    for (const t of list) {
      const k = ymd(parse(t.date));
      groups.set(k, [...(groups.get(k) ?? []), t]);
    }
    return [...groups.entries()];
  }, [txns, q, account, category]);

  const filtered = q || account !== "all" || category !== "all";
  const count = days.reduce((s, [, l]) => s + l.length, 0);

  return (
    <div>
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_12rem_11rem]">
        <label className="relative">
          <span className="sr-only">Search transactions</span>
          <MagnifyingGlass size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, category or note"
            className="h-9 w-full rounded-[7px] border border-line bg-surface pl-9 pr-3 text-[14px] text-ink placeholder:text-faint transition-colors hover:border-line-strong focus:border-accent focus:outline-none"
          />
        </label>
        <div className="grid grid-cols-2 gap-2 sm:contents">
          <Select aria-label="Account" value={account} onChange={(e) => setAccount(e.target.value)}>
            <option value="all">All accounts</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
          <Select aria-label="Category" value={category} onChange={(e) => setCategory(e.target.value as typeof category)}>
            <option value="all">All categories</option>
            {allCategories.map((c) => (
              <option key={c} value={c}>
                {categoryName[c]}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <p className="mt-3 flex items-center gap-3 text-[12.5px] text-muted">
        <span className="tabular-nums">
          {count} {count === 1 ? "transaction" : "transactions"}
        </span>
        {filtered && (
          <button
            type="button"
            className="text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink"
            onClick={() => {
              setQ("");
              setAccount("all");
              setCategory("all");
            }}
          >
            Clear filters
          </button>
        )}
      </p>

      {days.length ? (
        <div className="mt-6 flex flex-col gap-7">
          {days.slice(0, shown).map(([day, list]) => {
            const out = list.filter((t) => t.amount < 0 && t.category !== "transfers").reduce((s, t) => s - t.amount, 0);
            return (
              <section key={day}>
                <div className="mb-1 flex items-baseline justify-between px-1">
                  <h3 className="text-[13px] font-medium text-ink">
                    {relDay(day)}
                    {daysFrom(day) >= -1 && <span className="font-normal text-muted"> · {dayLabel(day)}</span>}
                  </h3>
                  {out > 0 && (
                    <span className="text-[12.5px] tabular-nums text-muted">
                      <span className="sr-only">Spent </span>
                      {money(out)} out
                    </span>
                  )}
                </div>
                <List>
                  {list.map((t) => (
                    <TxnRow key={t.id} t={t} accounts={accounts} showTime />
                  ))}
                </List>
              </section>
            );
          })}
          {days.length > shown && (
            <div>
              <Button onClick={() => setShown((n) => n + 14)}>Show earlier</Button>
            </div>
          )}
        </div>
      ) : (
        <Empty title="No transactions match">Try a different search, or clear the filters.</Empty>
      )}

      <TxnSheet id={openId} />
    </div>
  );
}
