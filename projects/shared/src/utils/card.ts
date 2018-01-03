import { Card, Rank, Suit } from "../cards";
import { rankToStr, strToRank } from "./rank";
import { suitToStr } from "./suit";

export function cardToStr(card: Card) {
  return `${rankToStr(card.rank)}${suitToStr(card.suit)}`;
}

export function cardEquals(a: Card, b: Card) {
  return a.rank === b.rank && a.suit === b.suit;
}

export const ALL_SUITS = [Suit.Clubs, Suit.Diamonds, Suit.Hearts, Suit.Spades];
export const ALL_CARDS: Card[] = [];
ALL_SUITS.forEach(suit => {
  for (let rank = 0 as Rank; rank < 13; rank++) {
    ALL_CARDS.push({ suit, rank });
  }
});

export const TWO_OF_CLUBS = {
  suit: Suit.Clubs,
  rank: strToRank("2"),
};

export const TEN_OF_CLUBS = {
  suit: Suit.Clubs,
  rank: strToRank("10"),
};

export const JACK_OF_DIAMONDS = { suit: Suit.Diamonds, rank: strToRank("J") };
export const ACE_OF_HEARTS = { suit: Suit.Hearts, rank: strToRank("A") };
export const QUEEN_OF_SPADES = { suit: Suit.Spades, rank: strToRank("Q") };

export const CHARGEABLE_CARDS = [TEN_OF_CLUBS, JACK_OF_DIAMONDS, ACE_OF_HEARTS, QUEEN_OF_SPADES];

export const POINT_CARDS = [
  { suit: Suit.Spades, rank: strToRank("Q") },
  { suit: Suit.Hearts, rank: strToRank("A") },
  { suit: Suit.Hearts, rank: strToRank("K") },
  { suit: Suit.Hearts, rank: strToRank("Q") },
  { suit: Suit.Hearts, rank: strToRank("J") },
  { suit: Suit.Hearts, rank: strToRank("10") },
  { suit: Suit.Hearts, rank: strToRank("9") },
  { suit: Suit.Hearts, rank: strToRank("8") },
  { suit: Suit.Hearts, rank: strToRank("7") },
  { suit: Suit.Hearts, rank: strToRank("6") },
  { suit: Suit.Hearts, rank: strToRank("5") },
  { suit: Suit.Hearts, rank: strToRank("4") },
  { suit: Suit.Hearts, rank: strToRank("3") },
  { suit: Suit.Hearts, rank: strToRank("2") },
];

export function isPointCard(card: Card): boolean {
  return POINT_CARDS.find(c => cardEquals(card, c)) !== undefined;
}
