import { ChatEntry } from "@tsm/shared";
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

  return (
    <div className="chat">
      <div className="chat-spacer" />
      <div className="chat-history">
        {chatEntries
          .map(
            entry =>
              entry.type === "message" ? (
                <div className="chat-row">
                  {entry.user}: {entry.message}
                </div>
              ) : (
                <div className="event-row">{entry.description}</div>
              ),
          )
          .reverse()}
      </div>
      <div className="chat-input">
        {player}:<input ref={el => (inputEl = el)} onKeyPress={handleKeyPress} />
      </div>
    </div>
  );
}
