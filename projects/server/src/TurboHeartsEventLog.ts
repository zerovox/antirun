import { ChatEntry } from "@antirun/shared";
import * as WebSocket from "ws";
import { sendEvent } from "./events";

export interface GameIdTaggedWebSocket extends WebSocket {
  gameId: number;
}

export class TurboHeartsEventLog {
  private gameId: number;
  private messages: ChatEntry[] = [];
  private ws: WebSocket.Server;

  constructor(gameId: number, clients: WebSocket.Server) {
    this.gameId = gameId;
    this.ws = clients;
  }

  public sendMessage(message: string, player: string) {
    const chatEntry: ChatEntry = {
      type: "message",
      user: player,
      message,
    };
    this.messages.push(chatEntry);
    this.ws.clients.forEach(client => {
      if (this.gameId !== (client as GameIdTaggedWebSocket).gameId) {
        return;
      }
      sendEvent(client, {
        name: "chat",
        message: chatEntry,
      });
    });
  }

  public sendEvent(description: string, player: string) {
    const chatEntry: ChatEntry = {
      type: "event",
      user: player,
      description,
    };
    this.messages.push(chatEntry);
    this.ws.clients.forEach(client => {
      if (this.gameId !== (client as GameIdTaggedWebSocket).gameId) {
        return;
      }
      sendEvent(client, {
        name: "chat",
        message: chatEntry,
      });
    });
  }

  public getEventLog() {
    return this.messages;
  }
}
