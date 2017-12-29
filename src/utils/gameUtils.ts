import { Card, RankString, Suit, Trick } from "../types";
import { makeObject } from "./makeObject";
import { strToRank } from "./rankUtils";
import { ALL_CARDS } from "../state/cards";

export function isRank(card: Card, rankString: RankString) {
  return card.rank === strToRank(rankString);
}

export function trickIsFinished(plays: Card[]) {
  if (plays.length === 0) {
    return false;
  }
  const leadSuit = plays[0].suit;
  const expectedTrickCount = plays.find(card => card.suit === leadSuit && isRank(card, "9"))
    ? 8
    : 4;
  return expectedTrickCount === plays.length;
}

export function handIsFinished(plays: Card[][]) {
  const playedCards = plays.reduce((count, trick) => count + trick.length, 0);
  return playedCards === ALL_CARDS.length;
}

export function trickWinner(trick: Trick, players: string[]): string {
  const leaderOffset = players.indexOf(trick.leadBy);
  const lead = trick.plays[0];
  const winningRank = trick.plays
    .filter(card => card.suit === lead.suit)
    .reduce((highRank, card) => Math.max(card.rank, highRank), lead.rank);
  const winningCardIndex = trick.plays.findIndex(
    card => card.suit === lead.suit && card.rank === winningRank,
  );
  return players[(leaderOffset + winningCardIndex) % 4];
}

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

export function scoreCards(cards: Card[], chargedCards: Card[]) {
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
