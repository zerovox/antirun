import { AutomataBuilder } from "../tsm/AutomataBuilder";

export enum WaitForPlayersStates {
  Waiting = "Waiting",
  Full = "Full",
}

export interface WaitForPlayersActions {
  join: (playerName: string) => void;
  leave: (playerName: string) => void;
}

export interface WaitForPlayersState {
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
      .withState(WaitForPlayersStates.Waiting, {
        transitions: {
          [WaitForPlayersStates.Full]: state => state.players.length === 4,
        },
      })
      .withState(WaitForPlayersStates.Full, {
        onEnter: state => opts.onFull(state.players),
      })
      .actions<WaitForPlayersActions>({
        join: (playerName: string) => (state: WaitForPlayersState) => ({
          players: state.players.includes(playerName)
            ? state.players
            : state.players.concat([playerName]),
        }),
        leave: (playerName: string) => (state: WaitForPlayersState) => ({
          players: state.players.filter(player => player !== playerName),
        }),
      })
      .initialize(WaitForPlayersStates.Waiting);
  },
};
