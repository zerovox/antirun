import * as WebSocket from "ws";
import { EMPTY_GAME, GameModel } from "./models/Game";
import { TurboHeartsEventLog } from "./TurboHeartsEventLog";
import { TurboHeartsGameEngine } from "./TurboHeartsGameEngine";

const activeGames: {
  [gameId: string]: {
    engine: TurboHeartsGameEngine;
    log: TurboHeartsEventLog;
  };
} = {};

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
