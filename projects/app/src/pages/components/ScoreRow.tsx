import { PlayerMap } from "@antirun/shared";
import * as React from "react";

export interface ScoreRowProps {
  players: string[];
  score: PlayerMap<number>;
}

export function ScoreRow(props: ScoreRowProps) {
  if (Object.keys(props.score).length !== 4) {
    return null;
  }

  // TODO : style

  return (
    <tr className="players-row">
      {props.players.map(player => (
        <td className="player" key={player}>
          {props.score[player]}
        </td>
      ))}
    </tr>
  );
}
