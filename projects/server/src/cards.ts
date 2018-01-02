import { Card, cardEquals, PassDirection, PlayerMap, Rank, strToRank, Suit } from "@tsm/shared";

export const ALL_SUITS = [Suit.Clubs, Suit.Diamonds, Suit.Hearts, Suit.Spades];
export const ALL_CARDS: Card[] = [];
ALL_SUITS.forEach(suit => {
  for (let rank = 0 as Rank; rank < 13; rank++) {
    ALL_CARDS.push({ suit, rank });
  }
});

export const TWO_OF_CLUBS = {
  suit: Suit.Clubs,
  rank: strToRank("2"),
};

export function applyPasses(
  hands: PlayerMap<Card[]>,
  pass: PlayerMap<[Card, Card, Card] | undefined>,
  players: string[],
  passDirection: PassDirection,
) {
  const finalHands: PlayerMap<Card[]> = {};
  for (const player in hands) {
    if (hands.hasOwnProperty(player)) {
      const initialHand = hands[player];
      finalHands[player] = applyPass(
        initialHand,
        pass[player]!,
        pass[getPassee(player, players, passDirection)]!,
      );
    }
  }
  return finalHands;
}

function applyPass(
  hand: Card[],
  outgoing: [Card, Card, Card],
  incoming: [Card, Card, Card],
): Card[] {
  return hand
    .filter(
      card =>
        !cardEquals(card, outgoing[0]) &&
        !cardEquals(card, outgoing[1]) &&
        !cardEquals(card, outgoing[2]),
    )
    .concat(incoming);
}

function getPassee(
  playerBeingPassedTo: string,
  players: string[],
  passDirection: PassDirection,
): string {
  const offset = ((dir: PassDirection) => {
    switch (dir) {
      case PassDirection.None:
        return 0;
      case PassDirection.Across:
        return 2;
      case PassDirection.Right:
        return 3;
      case PassDirection.Left:
        return 1;
    }
  })(passDirection);
  return players[(players.indexOf(playerBeingPassedTo) + offset) % 4];
}
