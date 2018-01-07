import { Card, Rank, Trick } from "../cards";
import { isRank } from "./rank";

export function trickIsFinished(trick: Trick) {
  if (trick.plays.length === 0) {
    return false;
  }
  const leadSuit = trick.plays[0].suit;
  const expectedTrickCount = trick.plays.find(card => card.suit === leadSuit && isRank(card, "9"))
    ? 8
    : 4;
  return expectedTrickCount === trick.plays.length;
}

export function trickWinner(trick: Trick, players: string[]): string {
  const leaderOffset = players.indexOf(trick.leadBy);
  return players[(leaderOffset + winningCardIndex(trick)) % 4];
}

export function winningCardIndex(trick: Trick) {
  const lead = trick.plays[0];

  const winningRank = trick.plays
    .filter(card => card.suit === lead.suit)
    .reduce((highRank, card) => Math.max(card.rank, highRank) as Rank, lead.rank);

  return trick.plays.findIndex(card => card.suit === lead.suit && card.rank === winningRank);
}

export function isInSuit(trick: Trick, card: Card) {
  const lead = trick.plays[0];
  return card.suit === lead.suit;
}

export function hasInSuitCard(trick: Trick, hand: Card[]): boolean {
  const lead = trick.plays[0];
  return hand.find(card => card.suit === lead.suit) !== undefined;
}

export function nextPlayerInTrick(trick: Trick, players: string[]): string {
  if (trickIsFinished(trick)) {
    return trickWinner(trick, players);
  }
  const leaderOffset = players.indexOf(trick.leadBy);
  return players[(leaderOffset + trick.plays.length) % 4];
}
