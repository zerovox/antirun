import * as React from "react";
import { PlayerMap } from "@tsm/shared";

export interface PreGameProps {
  player: string;
  players: string[];
  readyPlayers: PlayerMap<boolean>;
  ready: () => void;
  unready: () => void;
  join: () => void;
  leave: () => void;
}

export function PreGame({
  player,
  players,
  readyPlayers,
  ready,
  unready,
  join,
  leave,
}: PreGameProps) {
  return (
    <div className="pre-game">
      <div className="heading">{players.length}/4 players</div>
      <PlayerRow key={0} player={players[0]} readyPlayers={readyPlayers} />
      <PlayerRow key={1} player={players[1]} readyPlayers={readyPlayers} />
      <PlayerRow key={2} player={players[2]} readyPlayers={readyPlayers} />
      <PlayerRow key={3} player={players[3]} readyPlayers={readyPlayers} />
      {players.length === 4 ? (
        players.includes(player) && readyPlayers[player] ? (
          <button onClick={unready}>No, wait!</button>
        ) : (
          <button onClick={ready}>Ready?</button>
        )
      ) : players.includes(player) ? (
        <button onClick={leave}>Leave</button>
      ) : (
        <button onClick={join}>Join</button>
      )}
      {}
    </div>
  );
}

function PlayerRow({ player, readyPlayers }: { player: string; readyPlayers: PlayerMap<boolean> }) {
  return <div className={readyPlayers[player] ? "player -ready" : "player"}>{player || "..."}</div>;
}
