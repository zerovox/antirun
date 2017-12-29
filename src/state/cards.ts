import { Card, Rank, Suit } from "../types";

export const ALL_SUITS = [Suit.Clubs, Suit.Diamonds, Suit.Hearts, Suit.Spades];
export const ALL_CARDS: Card[] = [];
ALL_SUITS.forEach(suit => {
    for (let rank = 0 as Rank; rank < 13; rank++) {
        ALL_CARDS.push({ suit, rank });
    }
});
