import { Card, Suit, Trick } from "../cards";
import { makeObject } from "./makeObject";
import { isRank } from "./rank";
import { trickWinner } from "./trick";

export function scoreHand(tricks: Trick[], chargedCards: Card[], players: string[]) {
  return makeObject(players, player => {
    const cardsWon = tricks
      .filter(trick => trickWinner(trick, players) === player)
      .reduce((cards, trick) => cards.concat(trick.plays), [] as Card[]);
    return scoreCards(cardsWon, chargedCards);
  });
}

function hasTenOfClubs(cards: Card[]) {
  return cards.findIndex(card => card.suit === Suit.Clubs && isRank(card, "10")) > -1;
}

function hasJackOfDiamonds(cards: Card[]) {
  return cards.findIndex(card => card.suit === Suit.Diamonds && isRank(card, "J")) > -1;
}

function hasQueenOfSpades(cards: Card[]) {
  return cards.findIndex(card => card.suit === Suit.Spades && isRank(card, "Q")) > -1;
}

function hasAceOfHearts(cards: Card[]) {
  return cards.findIndex(card => card.suit === Suit.Hearts && isRank(card, "A")) > -1;
}

function scoreCards(cards: Card[], chargedCards: Card[]) {
  const multiplier = hasTenOfClubs(cards) ? (hasTenOfClubs(chargedCards) ? 4 : 2) : 1;
  const heartsWon = cards.filter(card => card.suit === Suit.Hearts).length;
  const heartPoints = hasAceOfHearts(chargedCards) ? 2 * heartsWon : heartsWon;
  const queenOfSpadesPoints = hasQueenOfSpades(cards)
    ? hasQueenOfSpades(chargedCards) ? 26 : 13
    : 0;
  const positivePoints = heartPoints + queenOfSpadesPoints;
  const negativePoints = hasJackOfDiamonds(cards) ? (hasJackOfDiamonds(chargedCards) ? 20 : 10) : 0;
  const shotTheMoon = hasQueenOfSpades(cards) && heartsWon === 13;

  return multiplier * ((shotTheMoon ? -positivePoints : positivePoints) - negativePoints);
}
