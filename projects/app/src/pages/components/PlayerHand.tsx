import { Card, cardEquals, cardToStr, rankToStr, Suit, suitToStr } from "@tsm/shared";
import * as React from "react";

export interface PlayerHandProps {
  hand: Card[];
  selectedCards: Card[];
  onClick: (card: Card) => void;
}

export function PlayerHand({ hand, onClick, selectedCards }: PlayerHandProps) {
  const clubs = hand.filter(card => card.suit === Suit.Clubs);
  const diamonds = hand.filter(card => card.suit === Suit.Diamonds);
  const hearts = hand.filter(card => card.suit === Suit.Hearts);
  const spades = hand.filter(card => card.suit === Suit.Spades);
  return (
    <div className="player-hand">
      <div className="suit-row _clubs">
        {suitToStr(Suit.Clubs)} {renderSuit(clubs, onClick, selectedCards)}
      </div>
      <div className="suit-row _diamonds">
        {suitToStr(Suit.Diamonds)} {renderSuit(diamonds, onClick, selectedCards)}
      </div>
      <div className="suit-row _hearts">
        {suitToStr(Suit.Hearts)} {renderSuit(hearts, onClick, selectedCards)}
      </div>
      <div className="suit-row _spades">
        {suitToStr(Suit.Spades)} {renderSuit(spades, onClick, selectedCards)}
      </div>
    </div>
  );
}

function renderSuit(cards: Card[], onClick: (card: Card) => void, selectedCards: Card[]) {
  return cards
    .sort((a, b) => b.rank - a.rank)
    .map(card => (
      <PlayerCard
        key={cardToStr(card)}
        card={card}
        onClick={onClick}
        selected={selectedCards.findIndex(c => cardEquals(c, card)) !== -1}
      />
    ));
}

interface PlayerCardProps {
  card: Card;
  selected: boolean;
  onClick: (card: Card) => void;
}

function PlayerCard({ card, onClick, selected }: PlayerCardProps) {
  const handleClick = () => onClick(card);
  const cardClasses = "player-card" + (selected ? " -selected" : "");
  return (
    <div className={cardClasses} onClick={handleClick}>
      {rankToStr(card.rank)}
    </div>
  );
}
