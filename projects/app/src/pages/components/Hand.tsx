import { Card, cardEquals, HandView } from "@tsm/shared";
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
  passed: boolean;
}

export class Hand extends React.Component<HandProps, HandComponentState> {
  public state: HandComponentState = {
    cardsToPass: [],
    passed: false,
  };

  public render() {
    const { player, players, handNumber, hand } = this.props;
    // TODO : if hand.readyPlayers[player] and hand.phase==="pass" then user has passed.
    return (
      <div className="game">
        <table className="trick-table">
          <thead>
            <HandHeadingRow handNumber={handNumber} />
            <PlayersRow players={players} readyPlayers={hand.readyPlayers} />
            <ChargesRow players={players} charges={hand.charges} />
            <tr className="spacer">
              <td colSpan={4} />
            </tr>
          </thead>
          <Tricks players={players} tricks={hand.tricks} />
          <tfoot>
            <tr className="spacer">
              <td colSpan={4} />
            </tr>
            <ScoreRow players={players} score={hand.score} />
          </tfoot>
        </table>

        <PlayerHand
          key={player}
          hand={hand.hands[player]}
          onClick={this.handleCardClick}
          selectedCards={this.state.cardsToPass}
        />

        {hand.phase === "pass" &&
          !this.state.passed && (
            <button disabled={this.state.cardsToPass.length !== 3} onClick={this.handlePass}>
              Pass
            </button>
          )}

        {hand.phase === "charge" && (
          <button onClick={this.handleNoCharge} disabled={hand.readyPlayers[player]}>
            No Charge
          </button>
        )}
      </div>
    );
  }

  private handleCardClick = (card: Card) => {
    if (this.props.hand.phase === "pass" && !this.state.passed) {
      const previousPass = this.state.cardsToPass;
      this.setState({
        cardsToPass: previousPass.find(c => cardEquals(card, c))
          ? previousPass.filter(c => !cardEquals(card, c))
          : previousPass.concat([card]),
      });
    } else if (this.props.hand.phase === "charge") {
      this.props.onCharge(card);
    } else if (this.props.hand.phase === "play") {
      this.props.onPlay(card);
    }
  };

  private handlePass = () => {
    this.props.onPass(this.state.cardsToPass);
    this.setState({ passed: true });
  };

  private handleNoCharge = () => {
    this.props.onSkipCharge();
  };
}
