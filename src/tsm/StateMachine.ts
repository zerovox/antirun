import { Emitter } from "./Emitter";

/*
TODO: flatten to
const f = {
        state: "PassLeftRound",
        data: {
          players: [],
        },
        frame: {
          state: "Charging",
          hands: {},
          frame: {
            state: "Waiting",
            charges: {
              "ts": [],
            }
          },
          actions: {
              join: () => {}
          }
        },
        actions: {

        }
      }
      State, Data, Actions, Frames.
 */
export interface StateMachineState<S extends {}, T extends {}, A extends {}> {
  state: S;
  machine: T;
  actions: A;
}

export type StateMachineSubscription<S extends StateMachineState<{}, {}, {}>> = (update: S) => void;

export interface StateMachine<S extends StateMachineState<{}, {}, {}>> {
  getState(): S;
  subscribe(cb: StateMachineSubscription<S>): this;
}

export type StateMachineCreator<S, C extends StateMachineState<{}, {}, {}>> = (
  state: S,
  emit: Emitter<S>,
) => StateMachine<C>;
