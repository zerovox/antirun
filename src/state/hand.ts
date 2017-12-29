import { AutomataBuilder } from "../tsm/AutomataBuilder";
import { ALL_CARDS, Card, PassDirection, PlayerMap, Trick } from "../types";
import { scoreHand } from "../utils/gameUtils";
import { makeObject } from "../utils/makeObject";
import { segment } from "../utils/segment";
import { shuffle } from "../utils/shuffle";
import { ChargeAutomata } from "./charge";
import { createPassAutomata, PassAutomata } from "./pass";
import { PlayAutomata } from "./play";

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

export interface HandAutomataOpts {
  passDirection: PassDirection;
  players: string[];
  onFinish: (score: PlayerMap<number>) => void;
}

export const HandAutomata = {
  create(opts: HandAutomataOpts) {
    const allHands = segment(shuffle(ALL_CARDS), 13);
    return new AutomataBuilder<HandData>({
      hands: makeObject(opts.players, (_playerName, index) => allHands[index]),
      tricks: [],
      chargedCards: {},
    })
      .withNestedAutomata(HandStates.Pass, (state, transitionTo) =>
        PassAutomata.create({
          passDirection: opts.passDirection,
          players: opts.players,
          hands: state.hands,
          onFinish: (finalHands: PlayerMap<Card[]>) =>
            transitionTo(HandStates.Charge, { hands: finalHands }),
        }),
      )
      .withNestedAutomata(HandStates.Charge, (state, transitionTo) =>
        ChargeAutomata.create({
          hands: state.hands,
          players: opts.players,
          onFinish: (chargedCards: PlayerMap<Card[]>) =>
            transitionTo(HandStates.Play, { chargedCards }),
        }),
      )
      .withNestedAutomata(HandStates.Play, state =>
        PlayAutomata.create({
          hands: state.hands,
          chargedCards: combine(state.chargedCards),
          onFinish: (tricks: Trick[]) =>
            opts.onFinish(scoreHand(tricks, combine(state.chargedCards), opts.players)),
        }),
      )
      .initialize(opts.passDirection === PassDirection.None ? HandStates.Charge : HandStates.Pass);
  },
};

function combine<T>(obj: { [key: string]: T[] }) {
  return Object.keys(obj).reduce((ts, key) => ts.concat(obj[key]), [] as T[]);
}
