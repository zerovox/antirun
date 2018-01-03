import { Card, Suit, Trick } from "../cards";
import { ACE_OF_HEARTS, cardEquals, JACK_OF_DIAMONDS, QUEEN_OF_SPADES, TEN_OF_CLUBS } from "./card";
import { makeObject } from "./makeObject";
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
  return cards.find(card => cardEquals(card, TEN_OF_CLUBS)) !== undefined;
}

function hasJackOfDiamonds(cards: Card[]) {
  return cards.find(card => cardEquals(card, JACK_OF_DIAMONDS)) !== undefined;
}

function hasQueenOfSpades(cards: Card[]) {
  return cards.find(card => cardEquals(card, QUEEN_OF_SPADES)) !== undefined;
}

function hasAceOfHearts(cards: Card[]) {
  return cards.find(card => cardEquals(card, ACE_OF_HEARTS)) !== undefined;
}

function scoreCards(cards: Card[], chargedCards: Card[]) {
  const multiplier = hasTenOfClubs(cards) ? 2 * (hasTenOfClubs(chargedCards) ? 2 : 1) : 1;
  const heartsWon = cards.filter(card => card.suit === Suit.Hearts).length;
  const heartPoints = (hasAceOfHearts(chargedCards) ? 2 : 1) * heartsWon;
  const queenOfSpadesPoints =
    (hasQueenOfSpades(cards) ? 13 : 0) * (hasQueenOfSpades(chargedCards) ? 2 : 1);
  const positivePoints = heartPoints + queenOfSpadesPoints;
  const negativePoints =
    (hasJackOfDiamonds(cards) ? 10 : 0) * (hasJackOfDiamonds(chargedCards) ? 2 : 1);
  const shotTheMoon = hasQueenOfSpades(cards) && heartsWon === 13;

  return multiplier * ((shotTheMoon ? -positivePoints : positivePoints) - negativePoints);
}
