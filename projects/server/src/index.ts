import { ClientEvent, getGameIdFromPathname } from "@antirun/shared";
import * as express from "express";
import * as fs from "fs";
import * as http from "http";
import * as Knex from "knex";
import { Model } from "objection";
import * as path from "path";
import * as WebSocket from "ws";
import { applyChatEvent, applyGameEvent, sendEvent } from "./events";
import { TurboHeartsGameEngine } from "./Game";
import { error, gameError, gameLog, info } from "./log";
import { EMPTY_GAME, GameModel } from "./models/Game";

const assetDir = path.join(__dirname, "../assets");
const knexConfigPath = path.join(process.cwd(), "knexfile.json");

const rawDbConfig = fs.readFileSync(knexConfigPath).toString("utf8");
const dbConfig = JSON.parse(rawDbConfig);
const knex = Knex(process.env.PROD ? dbConfig.production : dbConfig.development);

knex.migrate.latest({
  directory: path.join(__dirname, "migrations"),
});

Model.knex(knex);
const activeGames: { [gameId: string]: TurboHeartsGameEngine } = {};

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
  const gameId = request.url ? getGameIdFromPathname(request.url) : undefined;
  if (gameId === undefined) {
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

async function setupGame(ws: WebSocket, gameId: number, user: string) {
  const game = await getGameById(gameId);

  const unsub = game.subscribe(user, state => {
    sendEvent(ws, { name: "state", state });
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
    state: game.getViewForUser(user),
  });

  sendEvent(ws, {
    name: "chat-history",
    messages: [],
  });
}

async function getGameById(gameId: number): Promise<TurboHeartsGameEngine> {
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
    activeGames[gameId] = new TurboHeartsGameEngine(game);
  }

  return activeGames[gameId];
}

// start our server
server.listen(process.env.PORT || 8999, () => {
  info(`Server started on port ${server.address().port} :)`);
});
