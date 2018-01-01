import { ChatEntry } from "@tsm/shared";
import * as React from "react";

export interface ChatProps {
  chatEntries: ChatEntry[];
}

export function Chat({ chatEntries }: ChatProps) {
  return (
    <div className="chat">
      <div className="chat-history">
        {chatEntries.map(
          entry =>
            entry.type === "message" ? (
              <div className="chat-row">
                {entry.user}: {entry.message}
              </div>
            ) : (
              <div className="event-row">{entry.description}</div>
            ),
        )}
      </div>
      <div className="chat-input">
        TS: <input />
      </div>
    </div>
  );
}
