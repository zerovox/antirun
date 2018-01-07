import { Card, cardEquals, HandView, last, nextPlayerInTrick } from "@antirun/shared";
import * as React from "react";

import { ChargesRow } from "./ChargeRow";
import { HandHeadingRow } from "./HandHeadingRow";
import { PlayerHand } from "./PlayerHand";
import { PlayersRow } from "./PlayersRow";
import { ScoreRow } from "./ScoreRow";
import { Tricks } from "./Tricks";

export interface HandProps {
  player: string;
  players: string[];
  hand: HandView;
  handNumber: number;
  onPass: (card: Card[]) => void;
  onPlay: (card: Card) => void;
  onCharge: (card: Card) => void;
  onSkipCharge: () => void;
}

export interface HandComponentState {
  cardsToPass: Card[];
}

export class Hand extends React.Component<HandProps, HandComponentState> {
  public state: HandComponentState = {
    cardsToPass: [],
  };

  public render() {
    const { player, players, handNumber, hand } = this.props;

    const hasScore = Object.keys(hand.score).length === 4;
    const currentTrick = last(hand.tricks);
    const nextPlayer = currentTrick && nextPlayerInTrick(currentTrick, players);

    return (
      <div className="game">
        <table className="trick-table">
          <thead>
            <HandHeadingRow handNumber={handNumber} />
            <PlayersRow
              players={players}
              readyPlayers={hand.readyPlayers}
              currentPlayer={nextPlayer}
            />
            <ChargesRow players={players} charges={hand.charges} />
            <tr className="spacer">
              <td colSpan={4} />
            </tr>
          </thead>
          <Tricks players={players} tricks={hand.tricks} />
          <tfoot>
            {hasScore && (
              <tr className="spacer">
                <td colSpan={4} />
              </tr>
            )}
            {hasScore && <ScoreRow players={players} score={hand.score} />}
          </tfoot>
        </table>

        <PlayerHand
          key={player}
          hand={hand.hands[player]}
          onClick={this.handleCardClick}
          selectedCards={this.state.cardsToPass}
        />

        {hand.phase === "pass" &&
          !hand.readyPlayers[player] && (
            <button
              className="play-action"
              disabled={this.state.cardsToPass.length !== 3}
              onClick={this.handlePass}
            >
              Pass
            </button>
          )}

        {hand.phase === "charge" && (
          <button
            className="play-action"
            onClick={this.handleNoCharge}
            disabled={hand.readyPlayers[player]}
          >
            No Charge
          </button>
        )}
      </div>
    );
  }

  private handleCardClick = (card: Card) => {
    const { player, onCharge, onPlay, hand } = this.props;

    if (hand.phase === "pass" && !hand.readyPlayers[player]) {
      const previousPass = this.state.cardsToPass;
      this.setState({
        cardsToPass: previousPass.find(c => cardEquals(card, c))
          ? previousPass.filter(c => !cardEquals(card, c))
          : previousPass.concat([card]),
      });
    } else if (hand.phase === "charge") {
      onCharge(card);
    } else if (hand.phase === "play") {
      onPlay(card);
    }
  };

  private handlePass = () => {
    this.props.onPass(this.state.cardsToPass);
  };

  private handleNoCharge = () => {
    this.props.onSkipCharge();
  };
}
