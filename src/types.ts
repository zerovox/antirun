export enum Suit {
  Clubs = "Clubs",
  Diamonds = "Diamonds",
  Hearts = "Hearts",
  Spades = "Spades",
}

export type Rank =
  | 0 // "2"
  | 1 // "3"
  | 2 // "4"
  | 3 // "5"
  | 4 // "6"
  | 5 // "7"
  | 6 // "8"
  | 7 // "9"
  | 8 // "10"
  | 9 // "J"
  | 10 // "Q"
  | 11 // "K"
  | 12; // "A"

export type RankString =
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "J"
  | "Q"
  | "K"
  | "A";

export interface Card {
  suit: Suit;
  rank: Rank;
}

export interface Trick {
  leadBy: string;
  plays: Card[];
}

export interface PlayerMap<T> {
  [playerName: string]: T;
}

export enum PassDirection {
  Left = "Left",
  Right = "Right",
  Across = "Across",
  None = "None",
}

export const ALL_SUITS = [Suit.Clubs, Suit.Diamonds, Suit.Hearts, Suit.Spades];
export const ALL_CARDS: Card[] = [];
ALL_SUITS.forEach(suit => {
  for (let rank = 0 as Rank; rank < 13; rank++) {
    ALL_CARDS.push({ suit, rank });
  }
});
