import * as React from "react";

export function PlayersRow(props: { players: string[] }) {
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
