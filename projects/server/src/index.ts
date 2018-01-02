import { ClientEvent, getGameIdFromPathname } from "@tsm/shared";
import * as express from "express";
import * as http from "http";
import * as path from "path";
import * as WebSocket from "ws";
import { applyChatEvent, applyGameEvent, getViewForUser, sendEvent } from "./events";
import { error, gameError, gameLog, info } from "./log";
import { TurboHeartsGameAutomata } from "./state/game";

const activeGames: { [gameId: string]: TurboHeartsGameAutomata } = {};
const assetDir = path.join(__dirname, "../../app/dist");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(assetDir));
app.use("/", (req, res, next) => {
  // uri has a forward slash followed any number of any characters except full stops (up until the end of the string)
  if (/\/[^.]*$/.test(req.url)) {
    res.sendFile(path.join(assetDir, "index.html"));
  } else {
    next();
  }
});

wss.on("connection", (ws: WebSocket, request: http.IncomingMessage) => {
  const gameId = request.url && getGameIdFromPathname(request.url);
  if (!gameId) {
    ws.close();
    error("ws connection failed: game id not found in " + request.url);
    return;
  }

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

function setupGame(ws: WebSocket, gameId: string, user: string) {
  if (!activeGames[gameId]) {
    activeGames[gameId] = TurboHeartsGameAutomata.create();
  }

  const game = activeGames[gameId];

  const unsub = game.subscribe(data => {
    sendEvent(ws, { name: "state", state: getViewForUser(data, user) });
  });

  ws.addListener("message", (event: string) => {
    const parsedEvent: ClientEvent = JSON.parse(event);
    if (parsedEvent.name === "message") {
      applyChatEvent(wss, parsedEvent, user);
    } else if (parsedEvent.name === "init") {
      gameError(gameId, "received multiple init events");
    } else {
      try {
        applyGameEvent(game, parsedEvent, user);
        // TODO : broadcast game event in chat
      } catch (e) {
        error(e.message);
      } finally {
        sendEvent(ws, { name: "ack", nonce: parsedEvent.nonce });
      }
    }
  });

  ws.addListener("close", () => {
    unsub();
  });

  sendEvent(ws, {
    name: "state",
    state: getViewForUser(game.getData(), user),
  });

  sendEvent(ws, {
    name: "chat-history",
    messages: [],
  });
}

// start our server
server.listen(process.env.PORT || 8999, () => {
  info(`Server started on port ${server.address().port} :)`);
});
