import { Emitter } from "./Emitter";

export type AutomataState<D, C, A> = D & {
  frame: C;
  actions: A;
};

export type AutomataSubscription<S extends AutomataState<{}, {}, {}>> = (update: S) => void;

export interface Automata<S extends AutomataState<{}, {}, {}>> {
  getCurrentState(): S;
  subscribe(cb: AutomataSubscription<S>): this;
}

export type AutomataCreator<D, CS extends AutomataState<{}, {}, {}>> = (
  data: D,
  emit: Emitter<D>,
) => Automata<CS>;
