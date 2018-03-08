import { ClientEvent, getGameIdFromPathname } from "@antirun/shared";
import * as http from "http";
import * as WebSocket from "ws";
import { getGameById } from "./activeGames";
import { applyGameEvent, sendEvent } from "./events";
import { error, gameError, gameLog } from "./log";
import { GameIdTaggedWebSocket } from "./TurboHeartsEventLog";

export function setUpWebsocketApi(wss: WebSocket.Server) {
  wss.on("connection", (ws: WebSocket, request: http.IncomingMessage) => {
    const gameId = request.url ? getGameIdFromPathname(request.url) : undefined;
    if (gameId === undefined) {
      ws.close();
      error("ws connection failed: game id not found in " + request.url);
      return;
    }
    (ws as GameIdTaggedWebSocket).gameId = gameId;

    gameLog(gameId, "ws connect");

    const initListener = (event: string) => {
      const parsedEvent: ClientEvent = JSON.parse(event);
      if (parsedEvent.name === "init") {
        ws.removeListener("message", initListener);
        gameLog(gameId, "user init " + parsedEvent.user);
        setupGame(ws, gameId, parsedEvent.user);
      } else {
        gameError(gameId, "expected to receive init event but received " + parsedEvent.name);
      }
    };

    ws.addListener("message", initListener);
    ws.addListener("error", err => gameError(gameId, "ws error " + err.message));
  });

  async function setupGame(ws: WebSocket, gameId: number, user: string) {
    const { engine, log } = await getGameById(gameId, wss);

    const unsub = engine.subscribe(user, state => {
      sendEvent(ws, { name: "state", state });
    });

    ws.addListener("message", (event: string) => {
      const parsedEvent: ClientEvent = JSON.parse(event);
      if (parsedEvent.name === "message") {
        log.sendMessage(parsedEvent.message, user);
      } else if (parsedEvent.name === "init") {
        gameError(gameId, "received multiple init events");
      } else {
        try {
          applyGameEvent(engine, log, parsedEvent, user);
        } catch (e) {
          error(e.message);
        } finally {
          sendEvent(ws, { name: "ack", nonce: parsedEvent.nonce });
        }
      }
    });

    ws.addListener("close", () => {
      log.sendEvent(`${user} disconnected`, user);
      unsub();
    });

    sendEvent(ws, {
      name: "state",
      state: engine.getViewForUser(user),
    });

    sendEvent(ws, {
      name: "chat-history",
      messages: log.getEventLog(),
    });

    log.sendEvent(`${user} connected`, user);
  }
}
