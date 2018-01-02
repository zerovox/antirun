import { Card, cardEquals, HandState } from "@tsm/shared";
import * as React from "react";

import { HandHeadingRow } from "./HandHeadingRow";
import { PlayerHand } from "./PlayerHand";
import { PlayersRow } from "./PlayersRow";
import { Tricks } from "./Tricks";

export interface HandProps {
    player: string;
  players: string[];
  hand: HandState;
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

    return (
      <div className="game">
        <table className="trick-table">
          <thead>
            <HandHeadingRow handNumber={handNumber} />
            <PlayersRow players={players} />
          </thead>
          <Tricks players={players} tricks={hand.tricks} />
        </table>

        {Object.keys(hand.hands).map(player => (
          <PlayerHand
            key={player}
            hand={hand.hands[player]}
            onClick={this.handleCardClick}
            selectedCards={this.state.cardsToPass}
          />
        ))}

        {hand.phase.phase === "pass" && (
          <button disabled={this.state.cardsToPass.length !== 3} onClick={this.handlePass}>
            Pass
          </button>
        )}

          {hand.phase.phase === "charge" && (
            <button onClick={this.handleNoCharge} disabled={hand.phase.ready[player]}>
              No Charge
            </button>
          )}
      </div>
    );
  }

  private handleCardClick = (card: Card) => {
    if (this.props.hand.phase.phase === "pass") {
      const previousPass = this.state.cardsToPass;
      this.setState({
        cardsToPass: previousPass.find(c => cardEquals(card, c))
          ? previousPass.filter(c => !cardEquals(card, c))
          : previousPass.concat([card]),
      });
    } else if (this.props.hand.phase.phase === "charge") {
      this.props.onCharge(card);
    } else if (this.props.hand.phase.phase === "play") {
      this.props.onPlay(card);
    }
  };

  private handlePass = () => {
    this.props.onPass(this.state.cardsToPass);
    this.setState({ cardsToPass: [] });
  };

  private handleNoCharge = () => {
    this.props.onSkipCharge();
  };
}
