import { Card, Rank, RankString } from "../cards";

export function isRank(card: Card, rankString: RankString) {
  return card.rank === strToRank(rankString);
}

export function strToRank(name: RankString): Rank {
  switch (name) {
    case "2":
      return 0;
    case "3":
      return 1;
    case "4":
      return 2;
    case "5":
      return 3;
    case "6":
      return 4;
    case "7":
      return 5;
    case "8":
      return 6;
    case "9":
      return 7;
    case "10":
      return 8;
    case "J":
      return 9;
    case "Q":
      return 10;
    case "K":
      return 11;
    case "A":
      return 12;
  }
}

export function rankToStr(rank: Rank) {
  if (rank > 12 || rank < 0) {
    throw new Error("Invalid card rank");
  }
  if (rank === 12) {
    return "A";
  }
  if (rank === 11) {
    return "K";
  }
  if (rank === 10) {
    return "Q";
  }
  if (rank === 9) {
    return "J";
  }
  return (rank + 2).toString(10);
}
