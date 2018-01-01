import * as React from "react";
import { PlayerMap } from "../../../../shared/src/cards";

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
  if (players.length === 4) {
    return (
      <div className="pre-game">
        Players: {players.join(", ")}
        {players.includes(player) && readyPlayers[player] ? (
          <button onClick={unready}>No, wait!</button>
        ) : (
          <button onClick={ready}>Ready?</button>
        )}
      </div>
    );
  } else {
    return (
      <div className="pre-game">
        Players: {players.join(", ")}
        {players.includes(player) ? (
          <button onClick={leave}>Leave</button>
        ) : (
          <button onClick={join}>Join</button>
        )}
      </div>
    );
  }
}
