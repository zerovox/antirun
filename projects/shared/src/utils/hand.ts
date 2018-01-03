import { Suit, Trick } from "../cards";

export function handIsFinished(tricks: Trick[]) {
  const plays = tricks.map(trick => trick.plays);
  const playedCards = plays.reduce((count, trick) => count + trick.length, 0);
  return playedCards === 52;
}

export function heartsAreBroken(tricks: Trick[]) {
  for (const trick of tricks) {
    for (const card of trick.plays) {
      if (card.suit === Suit.Hearts) {
        return true;
      }
    }
  }

  return false;
}

export function trickCountOfSuit(tricks: Trick[], suit: Suit): number {
  return tricks.filter(trick => trick.plays[0].suit === suit).length;
}
