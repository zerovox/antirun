import { TransitionTo } from "./Emitter";

export type AutomataState<D, C, A> = D & C & {
  actions: A;
  state: any;
  frame: any;
};

export type AutomataSubscription<S extends AutomataState<{}, {}, {}>> = (update: S) => void;

export interface Automata<S extends AutomataState<{}, {}, {}>> {
  getCurrentState(): S;
  subscribe(cb: AutomataSubscription<S>): this;
}

export type AutomataCreator<D, CS extends AutomataState<{}, {}, {}>> = (
  data: D,
  transitionTo: TransitionTo<D>,
) => Automata<CS>;
