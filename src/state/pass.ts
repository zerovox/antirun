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

export interface PassAutomataOpts{
  passDirection: PassDirection;
  hands: PlayerMap<Card[]>;
  players: string[];
  onFinish: (finalHands: PlayerMap<Card[]>) => void;
}

export const PassAutomata = {
  create(opts: PassAutomataOpts) {
      return new AutomataBuilder<PassData>({
          pass: {},
      })
          .withState(PassStates.Passing, {
              transitions: {
                  [PassStates.Done]: data => Object.keys(data.pass).length === 4,
              },
          })
          .withState(PassStates.Done, {
              onEnter: data =>
                  opts.onFinish(applyPasses(opts.hands, data.pass, opts.players, opts.passDirection)),
          })
          .actions<PassActions>({
              pass: (playerName: string, pass: Pass) => ({ [playerName]: pass }),
          })
          .initialize(PassStates.Passing);
  }
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
