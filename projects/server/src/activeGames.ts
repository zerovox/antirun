import { GameList, getPassDirectionForHandIndex, PassDirection } from "@antirun/shared";
import * as WebSocket from "ws";
import { EMPTY_GAME, GameModel } from "./models/Game";
import { TurboHeartsEventLog } from "./TurboHeartsEventLog";
import { TurboHeartsGameEngine } from "./TurboHeartsGameEngine";
import { info } from "./log";

const activeGames: {
  [gameId: string]: {
    engine: TurboHeartsGameEngine;
    log: TurboHeartsEventLog;
  };
} = {};

export async function preloadGames(clients: WebSocket.Server) {
  const games = await GameModel.query()
    .select()
    .orderBy("id", "desc")
    .eager("hands");

  info(`Preloaded ${games.length} games`);

  games.forEach(game => {
    activeGames[game.id] = {
      engine: new TurboHeartsGameEngine(game),
      log: new TurboHeartsEventLog(game.id, clients),
    };
  });
}

export async function getGameById(
  gameId: number,
  clients: WebSocket.Server,
): Promise<{
  engine: TurboHeartsGameEngine;
  log: TurboHeartsEventLog;
}> {
  if (!activeGames[gameId]) {
    let game = await GameModel.query()
      .findById(gameId)
      .eager("hands");
    if (!game) {
      game = await GameModel.query().insertAndFetch({
        id: gameId,
        ...EMPTY_GAME,
      });
    }
    activeGames[gameId] = {
      engine: new TurboHeartsGameEngine(game),
      log: new TurboHeartsEventLog(gameId, clients),
    };
  }

  return activeGames[gameId];
}

export function getActiveGames(): GameList {
  return {
    games: Object.keys(activeGames).map(id => {
      const view = activeGames[id].engine.getViewForUser(undefined);
      return {
        id: +id,
        phase:
          view.game.phase === "pre-game"
            ? ("pre-game" as "pre-game")
            : view.game.hands.length === 4 && view.game.hands[3].phase === "score"
              ? ("post-game" as "post-game")
              : ("game" as "game"),
        hand:
          view.game.phase === "pre-game"
            ? PassDirection.Right
            : getPassDirectionForHandIndex(view.game.hands.length),
        players: view.players,
      };
    }),
  };
}
