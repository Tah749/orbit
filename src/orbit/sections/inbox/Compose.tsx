import { useEffect, useState } from "react";
import { Button, Field, Input, Sheet, Textarea } from "../../ui";
import { sendNew, type Draft } from "./mail";

const blank: Draft = { to: "", subject: "", body: "" };

/** Write a new message, or carry on with a draft. Sending only adds it to Sent. */
export function Compose({ open, draft, onClose }: { open: boolean; draft?: Draft; onClose: () => void }) {
  const [d, setD] = useState<Draft>(blank);
  const [tried, setTried] = useState(false);

  useEffect(() => {
    if (open) {
      setD(draft ?? blank);
      setTried(false);
    }
  }, [open, draft]);

  const dirty = !!(d.to.trim() || d.subject.trim() || d.body.trim());
  const missingTo = !d.to.trim();

  const send = () => {
    setTried(true);
    if (missingTo) return;
    sendNew(d, "sent");
    onClose();
  };

  const save = () => {
    sendNew(d, "drafts");
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={draft?.id ? "Edit draft" : "New message"}
      footer={
        <>
          <Button variant="ghost" onClick={save} disabled={!dirty} className="mr-auto">
            Save draft
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={send}>
            Send
          </Button>
        </>
      }
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            send();
          }
        }}
      >
        <Field label="To" hint={tried && missingTo ? "Add someone to send this to." : "A name or an email address. Separate several with commas."}>
          <Input
            value={d.to}
            onChange={(e) => setD({ ...d, to: e.target.value })}
            placeholder="priya@lumen.example"
            aria-invalid={tried && missingTo}
            autoFocus
            className={tried && missingTo ? "border-coral" : undefined}
          />
        </Field>
        <Field label="Subject">
          <Input value={d.subject} onChange={(e) => setD({ ...d, subject: e.target.value })} />
        </Field>
        <Field label="Message">
          <Textarea value={d.body} onChange={(e) => setD({ ...d, body: e.target.value })} rows={10} className="min-h-56" />
        </Field>
        <p className="text-[12.5px] leading-relaxed text-muted">This is a sample app. Sending adds the message to Sent here; nothing is emailed to anyone.</p>
      </form>
    </Sheet>
  );
}
