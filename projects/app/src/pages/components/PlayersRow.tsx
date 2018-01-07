import { PlayerMap } from "@antirun/shared";
import * as React from "react";

export interface PlayersRowProps {
  players: string[];
  readyPlayers: PlayerMap<boolean>;
  currentPlayer: string | undefined;
}

export function PlayersRow(props: PlayersRowProps) {
  return (
    <tr className="players-row">
      {props.players.map(player => (
        <td className={"player" + (props.readyPlayers[player] ? " -ready" : "")} key={player}>
          {player}
          {player === props.currentPlayer && "*"}
        </td>
      ))}
    </tr>
  );
}
