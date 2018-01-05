import * as Knex from "knex";

exports.up = function(knex: Knex) {
  return knex.schema
      .createTable('Hand', function (table) {
          table.increments('id')
              .primary();
          table.integer('parentId')
              .unsigned()
              .references('id')
              .inTable('Game');
          table.json("hands");
          table.json("passes");
          table.json("chargedCards");
          table.json("readyPlayers");
          table.json("tricks");
      })
      .createTable('Game', function (table) {
          table.increments('id')
              .primary();
          table.enu('phase', [
              'WAITING_FOR_PLAYERS',
              'WAITING_FOR_READY',
              'PASSING',
              'CHARGING',
              'PLAYING',
              'SCORES',
          ]);
          table.json("players");
          table.json("readyPlayers");
      })
};

exports.down = function(knex: Knex) {
    return knex.schema
        .dropTableIfExists('Hand')
        .dropTableIfExists('Game');
};
