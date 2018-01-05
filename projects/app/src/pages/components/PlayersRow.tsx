import { PlayerMap } from "@antirun/shared";
import * as React from "react";

export interface PlayersRowProps {
  players: string[];
  readyPlayers: PlayerMap<boolean>;
  // TODO : current players turn
}

export function PlayersRow(props: PlayersRowProps) {
  return (
    <tr className="players-row">
      {props.players.map(player => (
        <td className={"player" + (props.readyPlayers[player] ? " -ready" : "")} key={player}>
          {player}
        </td>
      ))}
    </tr>
  );
}
