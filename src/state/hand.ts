import { AutomataBuilder } from "../automata/AutomataBuilder";
import { TransitionTo } from "../automata/types";
import { Card, PassDirection, PlayerMap, Trick } from "../types";
import { scoreHand } from "../utils/gameUtils";
import { makeObject } from "../utils/makeObject";
import { segment } from "../utils/segment";
import { shuffle } from "../utils/shuffle";
import { ChargeActions, ChargeAutomata, ChargeData } from "./charge";
import { PassActions, PassAutomata, PassData } from "./pass";
import { PlayActions, PlayAutomata, PlayData } from "./play";
import { ALL_CARDS } from "./cards";

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

export interface HandState {
  Pass: PassData;
  Charge: ChargeData;
  Play: PlayData;
}

export type HandActions = PassActions & ChargeActions & PlayActions;

export const HandAutomata = {
  create(opts: HandAutomataOpts) {
    const allHands = segment(shuffle(ALL_CARDS), 13);
    return new AutomataBuilder<HandData>({
      hands: makeObject(opts.players, (_playerName, index) => allHands[index]),
      tricks: [],
      chargedCards: {},
    })
      .withNestedStates<HandState>({
        Pass: (state: HandData, transitionTo: TransitionTo<HandData>) =>
          PassAutomata.create({
            passDirection: opts.passDirection,
            players: opts.players,
            hands: state.hands,
            onFinish: (finalHands: PlayerMap<Card[]>) =>
              transitionTo(HandStates.Charge, { hands: finalHands }),
          }),
        Charge: (state: HandData, transitionTo: TransitionTo<HandData>) =>
          ChargeAutomata.create({
            hands: state.hands,
            players: opts.players,
            onFinish: (chargedCards: PlayerMap<Card[]>) =>
              transitionTo(HandStates.Play, { chargedCards }),
          }),
        Play: (state: HandData) =>
          PlayAutomata.create({
            hands: state.hands,
            chargedCards: combine(state.chargedCards),
            onFinish: (tricks: Trick[]) =>
              opts.onFinish(scoreHand(tricks, combine(state.chargedCards), opts.players)),
          }),
      })
      .initialize(opts.passDirection === PassDirection.None ? HandStates.Charge : HandStates.Pass);
  },
};

function combine<T>(obj: { [key: string]: T[] }) {
  return Object.keys(obj).reduce((ts, key) => ts.concat(obj[key]), [] as T[]);
}
