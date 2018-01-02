import {
  Card,
  ChatEvent,
  GameEvent,
  GamePhase,
  GameState,
  HandPhase,
  HandState,
  makeObject,
  PlayerMap,
  ServerEvent,
  assertNever,
} from "@tsm/shared";
import * as WebSocket from "ws";
import { error } from "./log";
import { GameData, GameState as InternalGameState, TurboHeartsGameAutomata } from "./state/game";
import { HandData, HandState as HS } from "./state/hand";

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
    case "pass":
      pass(game, player, event.cards);
      break;
    case "charge":
      charge(game, player, event.card);
      break;
    case "skip-charge":
      skipCharge(game, player);
      break;
    case "play":
      play(game, player, event.card);
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
  player: string,
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
    hands: [getHandDataViewForUser(game.PassLeft, player) || getHandDataFromScore(game.scores[0])],
  };
}

function getHandDataViewForUser(
  handData: (HandData & Partial<HS>) | undefined,
  player: string,
): HandState | undefined {
  if (!handData) {
    return undefined;
  }

  const phase = getHandPhaseForUser(handData);

  return {
    phase,
    charges: handData.chargedCards,
    hands: {
      [player]: handData.Play
        ? handData.Play.hands[player]
        : handData.hands[player],
    },
    tricks: handData.Play
      ? handData.Play.tricks
      : handData.tricks,
    score: {},
  };
}

function getHandDataFromScore(score: PlayerMap<number>): HandState {
  return {
    phase: { phase: "score" },
    charges: {},
    hands: {},
    tricks: [],
    score,
  };
}

function getHandPhaseForUser(handData: HandData & Partial<HS>): HandPhase {
  const pass = handData.Pass;
  const charge = handData.Charge;
  if (pass) {
    return {
      phase: "pass",
      passed: makeObject(Object.keys(pass.pass), player => !!pass.pass[player]),
    };
  }
  if (charge) {
    return {
      phase: "charge",
      ready: charge.done,
    };
  }
  return {
    phase: "play",
  };
}

export function sendEvent(ws: WebSocket, object: ServerEvent) {
  ws.send(JSON.stringify(object), err => {
    if (err !== undefined) {
      error("ws error " + err.message);
    }
  });
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

function pass(game: TurboHeartsGameAutomata, player: string, cards: Card[]) {
  const actions = game.getActions();
  if (actions.pass) {
    actions.pass({
      player,
      pass: {
        one: cards[0],
        two: cards[1],
        three: cards[2],
      },
    });
  } else {
    throw new Error("Could not pass the game");
  }
}

function charge(game: TurboHeartsGameAutomata, player: string, card: Card) {
    const actions = game.getActions();
    if (actions.charge) {
        actions.charge({player, card});
    } else {
        throw new Error("Could not unready the game");
    }
}

function skipCharge(game: TurboHeartsGameAutomata, player: string) {
    const actions = game.getActions();
    if (actions.skipCharge) {
        actions.skipCharge(player);
    } else {
        throw new Error("Could not unready the game");
    }
}

function play(game: TurboHeartsGameAutomata, player: string, card: Card) {
    const actions = game.getActions();
    if (actions.lead) {
        actions.lead({player, card});
    } else if (actions.follow) {
        actions.follow({player, card});
    } else {
        throw new Error("Could not unready the game");
    }
}
