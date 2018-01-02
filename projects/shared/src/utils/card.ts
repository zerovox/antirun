import { Card } from "../cards";
import { rankToStr } from "./rank";
import { suitToStr } from "./suit";

export function cardToStr(card: Card) {
  return `${rankToStr(card.rank)}${suitToStr(card.suit)}`;
}

export function cardEquals(a: Card, b: Card) {
  return a.rank === b.rank && a.suit === b.suit;
}
