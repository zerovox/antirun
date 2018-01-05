import { Card, cardToStr, PlayerMap } from "@antirun/shared";
import * as React from "react";

export interface ChargesRowProps {
  players: string[];
  charges: PlayerMap<Card[]>;
}

// TODO : text-decoration: strike-through once played.
// TODO : hide when empty.

export function ChargesRow(props: ChargesRowProps) {
  return (
    <tr className="charges-row">
      {props.players.map(player => (
        <td className="charge" key={player}>
          {props.charges[player].map(card => (
            <div className={"charged-card _" + card.suit.toLowerCase()}>{cardToStr(card)}</div>
          ))}
        </td>
      ))}
    </tr>
  );
}
