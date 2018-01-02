import { Card } from "./cards";
import { GameView } from "./game";

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
  | { name: "play"; card: Card });

export interface ChatEvent {
  name: "message";
  message: string;
}

export type ClientEvent = ConnectionEvent | GameEvent | ChatEvent;

export type ServerEvent =
  | { name: "ack"; nonce: string }
  | {
      name: "state";
      state: GameView;
    }
  | {
      name: "chat-history";
      messages: ChatEntry[];
    }
  | {
      name: "chat";
      message: ChatEntry;
    };
