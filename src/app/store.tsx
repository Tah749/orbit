import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { initialConnections, initialTasks, type Integration, type TabKey, type Task } from "./data";

type Toast = { id: number; text: string };

type Store = {
  tab: TabKey;
  go: (tab: TabKey) => void;
  tasks: Task[];
  toggleTask: (id: number) => void;
  addTask: (title: string, group: Task["group"]) => void;
  connections: Integration[];
  toggleConnection: (key: string) => void;
  readInbox: number[];
  markInboxRead: (id: number) => void;
  toasts: Toast[];
  toast: (text: string) => void;
  askQueue: string | null;
  ask: (question: string) => void;
  consumeAsk: () => string | null;
};

const Ctx = createContext<Store | null>(null);

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore outside provider");
  return s;
}

/** In-memory state for the demo. Nothing is persisted or sent anywhere. */
export function StoreProvider({ tab, go, children }: { tab: TabKey; go: (t: TabKey) => void; children: ReactNode }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [connections, setConnections] = useState(initialConnections);
  const [readInbox, setRead] = useState<number[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [askQueue, setAskQueue] = useState<string | null>(null);
  const nextId = useRef(100);

  const toast = useCallback((text: string) => {
    const id = nextId.current++;
    setToasts((t) => [...t, { id, text }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  const value = useMemo<Store>(
    () => ({
      tab,
      go,
      tasks,
      toggleTask: (id) => setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, done: !t.done } : t))),
      addTask: (title, group) =>
        setTasks((ts) => [{ id: nextId.current++, title, due: group === "today" ? "Today" : "Upcoming", group, source: "Added by you", done: false }, ...ts]),
      connections,
      toggleConnection: (key) => setConnections((cs) => cs.map((c) => (c.key === key ? { ...c, connected: !c.connected } : c))),
      readInbox,
      markInboxRead: (id) => setRead((r) => (r.includes(id) ? r : [...r, id])),
      toasts,
      toast,
      askQueue,
      ask: (q) => {
        setAskQueue(q);
        go("assistant");
      },
      consumeAsk: () => {
        const q = askQueue;
        if (q) setAskQueue(null);
        return q;
      },
    }),
    [tab, go, tasks, connections, readInbox, toasts, toast, askQueue],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
