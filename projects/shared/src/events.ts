import { Card } from "./cards";
import { GameState } from "./game";

export type ChatEntry =
  | {
      type: "message";
      user: string;
      message: string;
    }
  | {
      type: "event";
      user: string;
      description: string;
    };

export interface ConnectionEvent {
  name: "init";
  user: string;
}

export type GameEvent = { nonce: string } & (
  | { name: "join" }
  | { name: "leave" }
  | { name: "unready" }
  | { name: "ready" }
  | { name: "pass"; cards: Card[] }
  | { name: "charge"; card: Card }
  | { name: "skip-charge" }
  | { name: "play" });

export interface ChatEvent {
  name: "message";
  message: string;
}

export type ClientEvent = ConnectionEvent | GameEvent | ChatEvent;

export type ServerEvent =
  | { name: "ack"; nonce: string }
  | {
      name: "state";
      state: GameState;
    }
  | {
      name: "chat-history";
      messages: ChatEntry[];
    }
  | {
      name: "chat";
      message: ChatEntry;
    };
