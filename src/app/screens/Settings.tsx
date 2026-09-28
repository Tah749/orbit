import { useState } from "react";
import { EnvelopeSimple, CalendarBlank, Bank, ChartLineUp, Heartbeat, Tray, CalendarDots, LockSimple } from "@phosphor-icons/react";
import { IconTile } from "../../components/previews/primitives";
import { useStore } from "../store";
import { Card, CardHead, Modal, PageHeader } from "../ui";

const icons = { gmail: EnvelopeSimple, gcal: CalendarBlank, bank: Bank, invest: ChartLineUp, fitness: Heartbeat, outlook: Tray, mscal: CalendarDots };

function Switch({ on, onChange, label, locked }: { on: boolean; onChange: () => void; label: string; locked?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onChange}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? "bg-accent" : "bg-line"} ${locked ? "opacity-70" : ""}`}
    >
      <span className={`absolute left-0 top-0.5 size-5 rounded-full bg-ink transition-transform ${on ? "translate-x-[22px]" : "translate-x-0.5"}`} />
    </button>
  );
}

export function SettingsScreen() {
  const { connections, toggleConnection, toast } = useStore();
  const [perms, setPerms] = useState({ briefing: true, suggestTasks: true, readReceipts: false });
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Settings" subtitle="Choose what Orbit can see and do." />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="flex flex-col gap-3 p-5">
          <CardHead title="Connected accounts" />
          <ul className="flex flex-col divide-y divide-line">
            {connections.map((c) => (
              <li key={c.key} className="flex items-center gap-3 py-3">
                <IconTile icon={icons[c.key as keyof typeof icons]} tone={c.connected ? "rose" : "neutral"} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px]">{c.name}</p>
                  <p className="text-[12px] text-muted">{c.connected ? `${c.detail} · Connected` : `${c.detail} · Not connected`}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    toggleConnection(c.key);
                    toast(c.connected ? `${c.name} disconnected. Orbit no longer sees it.` : `Demo: ${c.name} would connect after you sign in and approve access.`);
                  }}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] ${c.connected ? "border border-line hover:bg-soft" : "bg-accent font-medium text-paper"}`}
                >
                  {c.connected ? "Disconnect" : "Connect"}
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="flex flex-col gap-4 p-5">
            <CardHead title="What Orbit can do" />
            {[
              { k: "briefing", label: "Daily briefing", hint: "A summary of your day each morning at 07:00" },
              { k: "suggestTasks", label: "Suggest tasks from email", hint: "Suggestions are added only when you accept them" },
              { k: "readReceipts", label: "Mark emails as read when I open them in Orbit", hint: "Keeps your inbox in sync" },
            ].map((p) => (
              <div key={p.k} className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[13.5px]">{p.label}</p>
                  <p className="text-[12px] text-muted">{p.hint}</p>
                </div>
                <Switch label={p.label} on={perms[p.k as keyof typeof perms]} onChange={() => setPerms((s) => ({ ...s, [p.k]: !s[p.k as keyof typeof perms] }))} />
              </div>
            ))}
            <div className="flex items-center justify-between gap-4 rounded-xl bg-soft p-3">
              <div>
                <p className="flex items-center gap-1.5 text-[13.5px]"><LockSimple size={13} /> Ask before sending, booking or changing anything</p>
                <p className="text-[12px] text-muted">Always on. Orbit never acts without your approval.</p>
              </div>
              <Switch label="Ask before acting" on locked onChange={() => toast("This one stays on.")} />
            </div>
          </Card>
          <Card className="flex flex-col gap-3 p-5">
            <CardHead title="Your data" />
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => toast("Demo: your data export would be emailed to you.")} className="rounded-full border border-line px-4 py-2 text-[13px] hover:bg-soft">Export my data</button>
              <button type="button" onClick={() => setConfirmDelete(true)} className="rounded-full border border-coral/40 px-4 py-2 text-[13px] text-coral hover:bg-coral/10">Delete account</button>
            </div>
          </Card>
        </div>
      </div>

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete your Orbit account?">
        <p className="text-[13.5px] text-muted">This disconnects every service and deletes what Orbit has stored about you. It can't be undone.</p>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => setConfirmDelete(false)} className="rounded-full border border-line px-4 py-2 text-[13px]">Cancel</button>
          <button type="button" onClick={() => { setConfirmDelete(false); toast("Demo account, so nothing was deleted."); }} className="rounded-full bg-coral px-4 py-2 text-[13px] font-medium text-paper">Delete</button>
        </div>
      </Modal>
    </div>
  );
}
