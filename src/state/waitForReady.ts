import { Automata, AutomataState } from "../tsm/Automata";
import { AutomataBuilder } from "../tsm/AutomataBuilder";
import { makeObject } from "../utils/makeObject";

export enum WaitForReadyStates {
  Waiting = "Waiting",
  Ready = "Ready",
}

export interface WaitForReadyActions {
  ready: (playerName: string) => void;
  unready: (playerName: string) => void;
  leave: (playerName: string) => void;
}

export interface WaitForReadyState {
  [name: string]: boolean;
}

// TODO : can we abstract these one-step machines
export function createWaitForReadyMachine(opts: {
  players: string[];
  onLeave: (player: string) => void;
  onAllReady: () => void;
}): Automata<AutomataState<WaitForReadyState, {}, WaitForReadyActions>> {
  const readyMap = makeObject(opts.players, () => false);
  return new AutomataBuilder(readyMap)
    .withState(WaitForReadyStates.Waiting, {
      transitions: {
        [WaitForReadyStates.Ready]: (state: WaitForReadyState) =>
          opts.players.every(player => state[player]),
      },
    })
    .withState(WaitForReadyStates.Ready, {
      onEnter: () => opts.onAllReady(),
    })
    .actions<WaitForReadyActions>({
      ready: (playerName: string) => ({ [playerName]: true }),
      unready: (playerName: string) => ({ [playerName]: false }),
      leave: (playerName: string) => opts.onLeave(playerName),
    })
    .initialize(WaitForReadyStates.Waiting);
}
