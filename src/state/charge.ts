import { AutomataBuilder } from "../tsm/AutomataBuilder";
import { Card, PlayerMap } from "../types";
import { makeObject } from "../utils/makeObject";

export enum ChargeStates {
  Charging = "Charging",
  Done = "Done",
}

export interface ChargeData {
  charges: PlayerMap<Card[]>;
  passes: PlayerMap<boolean>;
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
      passes: makeObject(opts.players, () => false),
    })
      .withState(ChargeStates.Charging, {
        transitions: {
          [ChargeStates.Done]: data =>
            opts.players.every(player => data.passes[player]) ||
            opts.players.reduce((count, player) => count + data.charges[player].length, 0) === 4,
        },
      })
      .withState(ChargeStates.Done, {
        onEnter: data => opts.onFinish(data.charges),
      })
      .actions<ChargeActions>({
        charge: (player: string, card: Card) => (data: ChargeData) => ({
          passes: makeObject(opts.players, key => key === player),
          charges: {
            ...data.charges,
            [player]: data.charges.player.concat([card]),
          },
        }),
        pass: (player: string) => (data: ChargeData) => ({
          passes: {
            ...data.passes,
            [player]: true,
          },
        }),
      })
      .initialize(ChargeStates.Charging);
  },
};
