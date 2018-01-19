import * as express from "express";
import { getActiveGames } from "./activeGames";

export function getRouter() {
  const router = express.Router();

  router.route("/games").get((_req, res) => {
    res.json(getActiveGames());
  });

  return router;
}
