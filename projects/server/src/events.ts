import { ChatEvent, GameEvent, GamePhase, GameState, ServerEvent } from "@tsm/shared";
import * as WebSocket from "ws";
import { GameData, GameState as InternalGameState, TurboHeartsGameAutomata } from "./state/game";

export function applyGameEvent(game: TurboHeartsGameAutomata, event: GameEvent, player: string) {
  switch (event.name) {
    case "join":
      join(game, player);
      break;
    case "leave":
      leave(game, player);
      break;
    case "ready":
      ready(game, player);
      break;
    case "unready":
      unready(game, player);
      break;
    default:
      throw new Error("Unknown event: " + event.name);
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

export function getViewForUser(
  game: GameData & Partial<InternalGameState>,
  player: string,
): GameState {
  return {
    players: game.WaitingForPlayers ? game.WaitingForPlayers.players : game.players,
    game: getGamePhaseViewForUser(game, player),
  };
}

function getGamePhaseViewForUser(
  game: GameData & Partial<InternalGameState>,
  _player: string,
): GamePhase {
  if (game.WaitingForReady) {
    return {
      phase: "pre-game",
      readyPlayers: game.WaitingForReady,
    };
  }
  if (game.WaitingForPlayers) {
    return {
      phase: "pre-game",
      readyPlayers: {},
    };
  }

  return {
    phase: "game",
    hands: [],
  };
}

export function sendEvent(ws: WebSocket, object: ServerEvent) {
  ws.send(JSON.stringify(object));
}

function join(game: TurboHeartsGameAutomata, player: string) {
  const actions = game.getActions();
  if (actions.join) {
    actions.join(player);
  } else {
    throw new Error("Could not join the game");
  }
}

function leave(game: TurboHeartsGameAutomata, player: string) {
  const actions = game.getActions();
  if (actions.leave) {
    actions.leave(player);
  } else {
    throw new Error("Could not leave the game");
  }
}

function ready(game: TurboHeartsGameAutomata, player: string) {
  const actions = game.getActions();
  if (actions.ready) {
    actions.ready(player);
  } else {
    throw new Error("Could not ready the game");
  }
}

function unready(game: TurboHeartsGameAutomata, player: string) {
  const actions = game.getActions();
  if (actions.unready) {
    actions.unready(player);
  } else {
    throw new Error("Could not unready the game");
  }
}
