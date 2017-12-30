import { Card, makeObject, PlayerMap } from "@tsm/shared";
import { AutomataBuilder } from "../automata/AutomataBuilder";

export enum ChargeStates {
  Charging = "Charging",
  Done = "Done",
}

export interface ChargeData {
  charges: PlayerMap<Card[]>;
  done: PlayerMap<boolean>;
}

export interface ChargeActions {
  charge(player: string, card: Card): void;

  pass(player: string): void;
}

export interface ChargeAutomataOpts {
  hands: PlayerMap<Card[]>;
  players: string[];
  onFinish: (chargedCards: PlayerMap<Card[]>) => void;
}

export const ChargeAutomata = {
  create(opts: ChargeAutomataOpts) {
    return new AutomataBuilder<ChargeData>({
      charges: makeObject(opts.players, () => []),
      done: makeObject(opts.players, () => false),
    })
      .withStates({
        Charging: {
          transitions: {
            [ChargeStates.Done]: (data: ChargeData) =>
              opts.players.every(player => data.done[player]) ||
              opts.players.reduce((count, player) => count + data.charges[player].length, 0) === 4,
          },
        },
        Done: {
          onEnter: (data: ChargeData) => opts.onFinish(data.charges),
        },
      })
      .withActions({
        // TODO : validate charges
        charge: (data: ChargeData) => (payload: { player: string; card: Card }) => ({
          done: makeObject(opts.players, () => false),
          charges: {
            ...data.charges,
            [payload.player]: data.charges.player.concat([payload.card]),
          },
        }),
        pass: (data: ChargeData) => (player: string) => ({
          done: {
            ...data.done,
            [player]: true,
          },
        }),
      })
      .initialize(ChargeStates.Charging);
  },
};
