import { Card, rankToStr, Suit, suitToStr } from "@tsm/shared";
import * as React from "react";

export interface HandProps {
  hand: Card[];
}

export function Hand({ hand }: HandProps) {
  const clubs = hand.filter(card => card.suit === Suit.Clubs);
  const diamonds = hand.filter(card => card.suit === Suit.Diamonds);
  const hearts = hand.filter(card => card.suit === Suit.Hearts);
  const spades = hand.filter(card => card.suit === Suit.Spades);
  return (
    <div className="card-hand">
      <div className="hand-suit -clubs">
        {suitToStr(Suit.Clubs)} {clubs.map(card => rankToStr(card.rank)).join(" ")}
      </div>
      <div className="hand-suit -diamonds">
        {suitToStr(Suit.Diamonds)} {diamonds.map(card => rankToStr(card.rank)).join(" ")}
      </div>
      <div className="hand-suit -hearts">
        {suitToStr(Suit.Hearts)} {hearts.map(card => rankToStr(card.rank)).join(" ")}
      </div>
      <div className="hand-suit -spades">
        {suitToStr(Suit.Spades)} {spades.map(card => rankToStr(card.rank)).join(" ")}
      </div>
    </div>
  );
}
