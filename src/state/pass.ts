import { AutomataBuilder } from "../tsm/AutomataBuilder";
import { Card, PassDirection, PlayerMap } from "../types";

export enum PassStates {
  Passing = "Passing",
  Done = "Done",
}
export interface Pass {
  one: Card;
  two: Card;
  three: Card;
}

export interface PassData {
  pass: PlayerMap<Pass>;
}

export interface PassActions {
  pass: (playerName: string, pass: Pass) => void;
}

export function createPassMachine(opts: {
  passDirection: PassDirection;
  hands: PlayerMap<Card[]>;
  players: string[];
  onFinish: (finalHands: PlayerMap<Card[]>) => void;
}) {
  return new AutomataBuilder<PassData>({
    pass: {},
  })
    .withState(PassStates.Passing, {
      transitions: {
        [PassStates.Done]: state => Object.keys(state.pass).length === 4,
      },
    })
    .withState(PassStates.Done, {
      onEnter: state =>
        opts.onFinish(applyPasses(opts.hands, state.pass, opts.players, opts.passDirection)),
    })
    .actions<PassActions>({
      pass: (playerName: string, pass: Pass) => ({ [playerName]: pass }),
    })
    .initialize(PassStates.Passing);
}

function applyPasses(
  hands: PlayerMap<Card[]>,
  pass: PlayerMap<Pass>,
  players: string[],
  passDirection: PassDirection,
) {
  const finalHands: PlayerMap<Card[]> = {};
  for (const player in hands) {
    if (hands.hasOwnProperty(player)) {
      const initialHand = hands[player];
      finalHands[player] = applyPass(
        initialHand,
        pass[player],
        pass[getPassee(player, players, passDirection)],
      );
    }
  }
  return finalHands;
}

function applyPass(hand: Card[], outgoing: Pass, incoming: Pass): Card[] {
  return hand
    .filter(card => card !== outgoing.one && card !== outgoing.two && card !== outgoing.three)
    .concat([incoming.one, incoming.two, incoming.three]);
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
