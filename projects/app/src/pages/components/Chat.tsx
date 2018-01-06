import { ChatEntry } from "@antirun/shared";
import * as React from "react";

export interface ChatProps {
  player: string;
  chatEntries: ChatEntry[];
  onSendMessage: (message: string) => void;
}

export function Chat({ player, chatEntries, onSendMessage }: ChatProps) {
  let inputEl: HTMLInputElement | null;

  const handleKeyPress = (evt: React.KeyboardEvent<{}>) => {
    if (evt.key === "Enter" && inputEl) {
      const value = inputEl.value;
      inputEl.value = "";
      onSendMessage(value);
    }
  };

  const chatHistoryRef = (el: HTMLDivElement) => {
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  };

  return (
    <div className="chat">
      <div ref={chatHistoryRef} className="chat-history">
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
        <span className="player-name">{player}:</span>
        <input ref={el => (inputEl = el)} onKeyPress={handleKeyPress} />
      </div>
    </div>
  );
}
