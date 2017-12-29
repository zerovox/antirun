import { AutomataBuilder } from "../tsm/AutomataBuilder";
import { ALL_CARDS, Card, PassDirection, PlayerMap, Trick } from "../types";
import { scoreHand } from "../utils/gameUtils";
import { makeObject } from "../utils/makeObject";
import { segment } from "../utils/segment";
import { shuffle } from "../utils/shuffle";
import { ChargeMachine } from "./charge";
import { createPassMachine } from "./pass";
import { PlayMachine } from "./play";

export enum HandStates {
  Pass = "Pass",
  Charge = "Charge",
  Play = "Play",
}

export interface HandData {
  hands: PlayerMap<Card[]>;
  chargedCards: PlayerMap<Card[]>;
  tricks: Trick[];
}

export function createHandMachine(opts: {
  passDirection: PassDirection;
  players: string[];
  onFinish: (score: PlayerMap<number>) => void;
}) {
  const allHands = segment(shuffle(ALL_CARDS), 13);
  return new AutomataBuilder<HandData>({
    hands: makeObject(opts.players, (_playerName, index) => allHands[index]),
    tricks: [],
    chargedCards: {},
  })
    .withNestedAutomata(HandStates.Pass, (state, emit) =>
      createPassMachine({
        passDirection: opts.passDirection,
        players: opts.players,
        hands: state.hands,
        onFinish: (finalHands: PlayerMap<Card[]>) => emit(HandStates.Charge, { hands: finalHands }),
      }),
    )
    .withNestedAutomata(HandStates.Charge, (state, emit) =>
      ChargeMachine.create({
        hands: state.hands,
        players: opts.players,
        onFinish: (chargedCards: PlayerMap<Card[]>) => emit(HandStates.Play, { chargedCards }),
      }),
    )
    .withNestedAutomata(HandStates.Play, state =>
      PlayMachine.create({
        hands: state.hands,
        chargedCards: combine(state.chargedCards),
        onFinish: (tricks: Trick[]) =>
          opts.onFinish(scoreHand(tricks, combine(state.chargedCards), opts.players)),
      }),
    )
    .initialize(opts.passDirection === PassDirection.None ? HandStates.Charge : HandStates.Pass);
}

function combine<T>(obj: { [key: string]: T[] }) {
  return Object.keys(obj).reduce((ts, key) => ts.concat(obj[key]), [] as T[]);
}
