import { GameData, GameState, TurboHeartsGameAutomata } from "./state/game";
import { Card } from "./types";

const activeGames: { [gameId: string]: TurboHeartsGameAutomata } = {};

/* if (state.WaitingForPlayers) {
    actions.join!("Player " + (state.WaitingForPlayers.players.length + 1));
  }
 if (state.WaitingForReady) {
    const playerReadyState = state.WaitingForReady;
    const readyPlayerCount = state.players.reduce(
      (count, name) => count + (playerReadyState[name] ? 1 : 0),
      0,
    );
    actions.ready!(state.players[readyPlayerCount]);
  }
 */

type Msg =
  | { action: "join" }
  | { action: "leave" }
  | { action: "ready" }
  | { action: "pass"; cards: Card[] }
  | { action: "charge"; card: Card }
  | { action: "skip-charge" }
  | { action: "play" }
  | { action: "chat"; message: string };

type Event =
  | {
      name: "state";
      state: {};
    }
  | { name: "chat"; message: string };

function userConnect(
  user: string,
  gameId: string,
  userEvents: (cb: (msg: Msg) => void) => () => void,
  eventsForUser: (msg: Event) => void,
) {
  if (!activeGames[gameId]) {
    // TODO: generate from database?
    activeGames[gameId] = TurboHeartsGameAutomata.create();
  }

  const game = activeGames[gameId];

  userEvents(msg => {
    switch (msg.action) {
      case "join":
        join(game, user);
        break;
    }
  });

  game.subscribe(data => eventsForUser({ name: "state", state: getViewForUser(data, user) }));

  eventsForUser({ name: "state", state: getViewForUser(game.getData(), user) });
}

function getViewForUser(_game: GameData & Partial<GameState>, _player: string) {
  return {};
}

function join(game: TurboHeartsGameAutomata, player: string) {
  const actions = game.getActions();
  if (actions.join) {
    actions.join(player);
  } else {
    throw new Error("Could not join the game");
  }
}
