import { assertNever, cardToStr, GameEvent, ServerEvent } from "@antirun/shared";
import * as WebSocket from "ws";
import { error } from "./log";
import { TurboHeartsEventLog } from "./TurboHeartsEventLog";
import { TurboHeartsGameEngine } from "./TurboHeartsGameEngine";

export function applyGameEvent(
  game: TurboHeartsGameEngine,
  log: TurboHeartsEventLog,
  event: GameEvent,
  player: string,
) {
  switch (event.name) {
    case "join":
      game.join(player);
      log.sendEvent(`${player} joined the game.`, player);
      break;
    case "leave":
      game.leave(player);
      log.sendEvent(`${player} left the game.`, player);
      break;
    case "ready":
      game.ready(player);
      log.sendEvent(`${player} is ready.`, player);
      break;
    case "unready":
      game.unready(player);
      log.sendEvent(`${player} has made a mistake.`, player);
      break;
    case "pass":
      game.pass(player, event.cards);
      log.sendEvent(`${player} passed.`, player);
      break;
    case "charge":
      game.charge(player, event.card);
      log.sendEvent(`${player} charged the ${cardToStr(event.card)}.`, player);
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

export function sendEvent(ws: WebSocket, object: ServerEvent) {
  ws.send(JSON.stringify(object), err => {
    if (err !== undefined) {
      error("ws error " + err.message);
    }
  });
}
