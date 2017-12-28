import { StateMachineBuilder } from "../tsm/StateMachineBuilder";
import { makeObject } from "../utils/makeObject";
import { segment } from "../utils/segment";
import { shuffle } from "../utils/shuffle";
import { ALL_CARDS, Card, PassDirection, PlayerMap } from "../types";
import { createPassMachine } from "./pass";

export enum HandStates {
  Pass = "Pass",
  Charge = "Charge",
  Play = "Play",
}

export interface HandState {
  hands: PlayerMap<Card[]>;
  chargedCards: PlayerMap<Card[]>;
  tricks: Card[][];
}

export interface HandScore {}

export function createHandMachine(opts: {
  passDirection: PassDirection;
  players: string[];
  onFinish: (score: HandScore) => void;
}) {
  const allHands = segment(shuffle(ALL_CARDS), 13);
  return new StateMachineBuilder<HandState>({
    hands: makeObject(opts.players, (_playerName, index) => allHands[index]),
    tricks: [],
    chargedCards: {},
  })
    .withSubmachine(HandStates.Pass, (state, emit) =>
      createPassMachine({
        passDirection: opts.passDirection,
        players: opts.players,
        hands: state.hands,
        onFinish: (finalHands: PlayerMap<Card[]>) => emit(HandStates.Charge, { hands: finalHands }),
      }),
    )
    .withSubmachine(HandStates.Charge, (state, emit) =>
      createChargeMachine({
        hands: state.hands,
        onFinish: (chargedCards: PlayerMap<Card[]>) => emit(HandStates.Play, { chargedCards }),
      }),
    )
    .withSubmachine(HandStates.Play, (state, emit) =>
      createPlayMachine({
        hands: state.hands,
        chargedCards: state.chargedCards,
        // TODO : score
        onFinish: (_tricks: PlayerMap<Card[]>) => opts.onFinish({}),
      }),
    )
    .initialize(opts.passDirection === PassDirection.None ? HandStates.Charge : HandStates.Pass);
}
