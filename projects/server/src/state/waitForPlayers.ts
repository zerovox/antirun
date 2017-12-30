import { AutomataBuilder } from "../automata/AutomataBuilder";

export enum WaitForPlayersStates {
  Waiting = "Waiting",
  Full = "Full",
}

export interface WaitForPlayersActions {
  join: (playerName: string) => void;
  leave: (playerName: string) => void;
}

export interface WaitForPlayersData {
  players: string[];
}

export interface WaitForPlayersOpts {
  players: string[];
  onFull: (players: string[]) => void;
}

// TODO : can we abstract these one-step automatas
export const WaitForPlayersAutomata = {
  create(opts: WaitForPlayersOpts) {
    return new AutomataBuilder({ players: opts.players })
      .withStates({
        Waiting: {
          transitions: {
            [WaitForPlayersStates.Full]: (data: WaitForPlayersData) => data.players.length === 4,
          },
        },
        Full: {
          onEnter: (data: WaitForPlayersData) => opts.onFull(data.players),
        },
      })
      .withActions<WaitForPlayersActions>({
        join: (state: WaitForPlayersData) => (playerName: string) => ({
          players: state.players.includes(playerName)
            ? state.players
            : state.players.concat([playerName]),
        }),
        leave: (state: WaitForPlayersData) => (playerName: string) => ({
          players: state.players.filter(player => player !== playerName),
        }),
      })
      .initialize(WaitForPlayersStates.Waiting);
  },
};
