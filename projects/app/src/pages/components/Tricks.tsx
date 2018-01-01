import { rankToStr, segment, suitToStr, Trick } from "@tsm/shared";
import * as React from "react";

export interface TricksProps {
  players: string[];
  tricks: Trick[];
}

export function Tricks({ players, tricks }: TricksProps) {
  return (
    <tbody>
      {React.Children.toArray(
        tricks.map((trick, index) => renderTrick(players, trick, tricks.length - index - 1)),
      )}
    </tbody>
  );
}

function renderTrick(players: string[], trick: Trick, trickAge: number): React.ReactChild[] {
  const blankCellCount = players.indexOf(trick.leadBy);
  const cells: JSX.Element[] = [];
  for (let i = 0; i < blankCellCount; i++) {
    cells.push(<td />);
  }
  trick.plays.forEach(play =>
    cells.push(
      <td className={"play -" + play.suit.toLowerCase()}>
        {rankToStr(play.rank)}
        {suitToStr(play.suit)}
      </td>,
    ),
  );

  const trickRowClasses = "trick-row -trick-n" + (trickAge > 0 ? "-" + trickAge : "");
  return React.Children.toArray(
    segment(cells, 4).map(plays => (
      <tr className={trickRowClasses}>{React.Children.toArray(plays)}</tr>
    )),
  );
}
