import { assertNever, ChatEvent, GameEvent, ServerEvent } from "@tsm/shared";
import * as WebSocket from "ws";
import { TurboHeartsGame } from "./Game";
import { error } from "./log";

export function applyGameEvent(game: TurboHeartsGame, event: GameEvent, player: string) {
  // TODO : game log.

  switch (event.name) {
    case "join":
      game.join(player);
      break;
    case "leave":
      game.leave(player);
      break;
    case "ready":
      game.ready(player);
      break;
    case "unready":
      game.unready(player);
      break;
    case "pass":
      game.pass(player, event.cards);
      break;
    case "charge":
      game.charge(player, event.card);
      break;
    case "skip-charge":
      game.skipCharge(player);
      break;
    case "play":
      game.play(player, event.card);
      break;
    default:
      assertNever("Unknown event: ", event);
  }
}

export function applyChatEvent(clients: WebSocket.Server, event: ChatEvent, player: string) {
  clients.clients.forEach(client => {
    sendEvent(client, {
      name: "chat",
      message: {
        type: "message",
        user: player,
        message: event.message,
      },
    });
  });
}

export function sendEvent(ws: WebSocket, object: ServerEvent) {
  ws.send(JSON.stringify(object), err => {
    if (err !== undefined) {
      error("ws error " + err.message);
    }
  });
}
