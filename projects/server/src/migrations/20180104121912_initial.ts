import * as Knex from "knex";

export const up = (knex: Knex) =>
  knex.schema
    .createTable("Hand", table => {
      table.increments("id").primary();
      table
        .integer("parentId")
        .unsigned()
        .references("id")
        .inTable("Game");
      table.json("hands");
      table.json("passes");
      table.json("chargedCards");
      table.json("readyPlayers");
      table.json("tricks");
    })
    .createTable("Game", table => {
      table.increments("id").primary();
      table.enu("phase", [
        "WAITING_FOR_PLAYERS",
        "WAITING_FOR_READY",
        "PASSING",
        "CHARGING",
        "PLAYING",
        "SCORES",
      ]);
      table.json("players");
      table.json("readyPlayers");
    });

export const down = (knex: Knex) => knex.schema.dropTableIfExists("Hand").dropTableIfExists("Game");
