import { Card, Rank, Trick } from "../cards";
import { isRank } from "./rank";

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
  return playedCards === 52;
}

export function trickWinner(trick: Trick, players: string[]): string {
  const leaderOffset = players.indexOf(trick.leadBy);
  const lead = trick.plays[0];
  const winningRank = trick.plays
    .filter(card => card.suit === lead.suit)
    .reduce((highRank, card) => Math.max(card.rank, highRank) as Rank, lead.rank);
  const winningCardIndex = trick.plays.findIndex(
    card => card.suit === lead.suit && card.rank === winningRank,
  );
  return players[(leaderOffset + winningCardIndex) % 4];
}
