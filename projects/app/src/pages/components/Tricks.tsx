import { cardToStr, segment, Trick, winningCardIndex } from "@antirun/shared";
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
  const winningIndex = winningCardIndex(trick);
  trick.plays.forEach((play, index) => {
    const playClasses =
      "play _" + play.suit.toLowerCase() + ((index === winningIndex) ? " -high-card" : "");
    cells.push(<td className={playClasses}>{cardToStr(play)}</td>);
  });

  const trickRowClasses = "trick-row -trick-n" + (trickAge > 0 ? "-" + trickAge : "");
  return React.Children.toArray(
    segment(cells, 4).map(plays => (
      <tr className={trickRowClasses}>{React.Children.toArray(plays)}</tr>
    )),
  );
}
