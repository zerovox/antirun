import * as React from "react";

export interface PlayersRowProps {
  players: string[];
}

export function PlayersRow(props: PlayersRowProps) {
  return (
    <tr className="players-row">
      {props.players.map(player => (
        <td className="player" key={player}>
          {player}
        </td>
      ))}
    </tr>
  );
}
