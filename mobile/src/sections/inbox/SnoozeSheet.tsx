import { Sheet, Row, Text, List } from "../../ui";
import type { Message } from "@orbit/data/mail";
import { snooze } from "./actions";
import { snoozeOptions } from "./views";

/** Choose when a message should come back. */
export function SnoozeSheet({ message, onClose }: { message?: Message; onClose: (snoozed: boolean) => void }) {
  return (
    <Sheet open={!!message} onClose={() => onClose(false)} title="Snooze until">
      <List>
        {snoozeOptions.map((o) => (
          <Row
            key={o.key}
            minHeight={52}
            onPress={() => {
              if (message) snooze(message, o);
              onClose(true);
            }}
            right={
              <Text size={12} font="mono" tone="faint">
                {o.hint()}
              </Text>
            }
          >
            <Text size={15}>{o.label}</Text>
          </Row>
        ))}
      </List>
    </Sheet>
  );
}
