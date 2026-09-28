import type { Account, Txn } from "../../data/money";
import { categoryName } from "../../data/money";
import { href } from "../../router";
import { Amount, Row, Source, Tag } from "../../ui";
import { time } from "../../time";

export const accountOf = (accounts: Account[], id: string) => accounts.find((a) => a.id === id);

/** One transaction: merchant, category and account, amount right-aligned. */
export function TxnRow({ t, accounts, showTime = false }: { t: Txn; accounts: Account[]; showTime?: boolean }) {
  const acc = accountOf(accounts, t.accountId);
  return (
    <Row href={href(`money/transactions/${t.id}`)} className="min-h-[48px] py-2.5">
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-[14px] text-ink">
          <span className="truncate">{t.merchant}</span>
          {t.pending && <Tag>Pending</Tag>}
        </p>
        <p className="mt-0.5 flex min-w-0 items-center gap-x-2 truncate text-[12.5px] text-muted">
          <span className="truncate">
            {categoryName[t.category]}
            {showTime && ` · ${time(t.date)}`}
            {t.note && ` · ${t.note}`}
          </span>
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <Amount value={t.amount} signed className={t.pending ? "text-[14px] text-muted" : "text-[14px] text-ink"} />
        {acc && <Source id={acc.institution} />}
      </div>
    </Row>
  );
}
