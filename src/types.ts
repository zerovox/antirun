export enum Suit {
  Clubs = "Clubs",
  Diamonds = "Diamonds",
  Hearts = "Hearts",
  Spades = "Spades",
}

export interface Card {
  suit: Suit;
  // 0 -> "2", 12 -> "A"
  rank: number;
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
  for (let rank = 0; rank < 13; rank++) {
    ALL_CARDS.push({ suit, rank });
  }
});
