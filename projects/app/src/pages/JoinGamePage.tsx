import { GameList, getUrlForGameId, PassDirection } from "@antirun/shared";
import * as React from "react";

export interface JoinGamePageProps {
  activeGames: GameList;
}

export function JoinGamePage({ activeGames }: JoinGamePageProps) {
  return (
    <div className="join-game">
      <div className="site-header">anti.run</div>
      <div className="game-table">
        <div className="table-header">active games</div>
        <table>
          <tbody>
            {activeGames.games.filter(game => game.phase !== "post-game").map((game, index) => (
              <tr key={index}>
                <td>
                  <a href={getUrlForGameId(game.id)}>Game {game.id}</a>
                </td>
                <td>
                  {game.phase === "pre-game"
                    ? `Waiting for players (${game.players.length}/4)`
                    : handToString(game.hand)}
                </td>
                <td>{game.players.join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="game-table">
        <div className="table-header">finished games</div>
        <table>
          <tbody>
            {activeGames.games.filter(game => game.phase === "post-game").map((game, index) => (
              <tr key={index}>
                <td>
                  <a href={getUrlForGameId(game.id)}>Game {game.id}</a>
                </td>
                <td>{game.players.join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function handToString(hand: PassDirection) {
  if (hand === PassDirection.Left) {
    return "Pass left";
  }
  if (hand === PassDirection.Right) {
    return "Pass right";
  }
  if (hand === PassDirection.Across) {
    return "Pass across";
  }
  return "Keeper";
}
