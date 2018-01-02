import { Suit } from "../cards";

export function suitToStr(suit: Suit) {
  switch (suit) {
    case Suit.Clubs:
      return String.fromCharCode(9827);
    case Suit.Diamonds:
      return String.fromCharCode(9830);
    case Suit.Hearts:
      return String.fromCharCode(9829);
    case Suit.Spades:
      return String.fromCharCode(9824);
  }
}
