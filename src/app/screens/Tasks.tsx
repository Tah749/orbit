import { useState } from "react";
import { Circle, CheckCircle, Plus, Lightning } from "@phosphor-icons/react";
import { Pill } from "../../components/previews/primitives";
import { useStore } from "../store";
import { Card, PageHeader, Segmented } from "../ui";

const views = ["Today", "Upcoming", "Completed"] as const;
type View = (typeof views)[number];

export function TasksScreen() {
  const { tasks, toggleTask, addTask, toast } = useStore();
  const [view, setView] = useState<View>("Today");
  const [title, setTitle] = useState("");
  const list = tasks.filter((t) => (view === "Completed" ? t.done : !t.done && t.group === view.toLowerCase()));

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Tasks and reminders" subtitle={`${tasks.filter((t) => !t.done).length} open tasks`} />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return toast("Give the task a name first.");
          addTask(title.trim(), view === "Upcoming" ? "upcoming" : "today");
          setTitle("");
          if (view === "Completed") setView("Today");
          toast("Task added.");
        }}
        className="flex gap-2"
      >
        <label htmlFor="new-task" className="sr-only">New task</label>
        <input
          id="new-task"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a task, like 'Call the garage'"
          className="h-11 min-w-0 flex-1 rounded-full border border-line bg-soft px-4 text-[14px] placeholder:text-faint focus:border-accent focus:outline-none"
        />
        <button type="submit" className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-accent px-4 text-[13.5px] font-medium text-paper hover:bg-accent-hover">
          <Plus size={14} weight="bold" /> Add task
        </button>
      </form>
      <Segmented items={views} value={view} onChange={setView} label="Task views" className="w-full sm:w-auto" />
      <Card className="overflow-hidden">
        {list.length === 0 ? (
          <p className="p-8 text-center text-[13.5px] text-muted">{view === "Completed" ? "Nothing completed yet." : "You're all caught up."}</p>
        ) : (
          <ul className="divide-y divide-line">
            {list.map((t) => (
              <li key={t.id}>
                <button type="button" role="checkbox" aria-checked={t.done} onClick={() => toggleTask(t.id)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-soft/60">
                  {t.done ? <CheckCircle size={20} weight="fill" className="shrink-0 text-accent" /> : <Circle size={20} className="shrink-0 text-faint" />}
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-[13.5px] ${t.done ? "text-muted line-through" : ""}`}>{t.title}</p>
                    <p className="truncate text-[12px] text-muted">{t.due} · {t.source}</p>
                  </div>
                  {t.priority && !t.done && <Pill tone="rose" className="shrink-0">Priority</Pill>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <p className="flex items-center gap-1.5 text-[12.5px] text-muted">
        <Lightning size={13} weight="fill" className="text-accent" /> Tasks marked "From email" were suggested by Orbit and added with your OK.
      </p>
    </div>
  );
}
