export type TransitionTo<S> = (stateName: string, state?: Partial<S>) => void;

export type AutomataSubscription<D, A> = (update: D, actions: A) => void;

export interface Automata<D, A> {
  getData(): D;
  getActions(): A;
  subscribe(cb: AutomataSubscription<D, A>): () => void;
}

export type AutomataCreator<D, C, A> = (data: D, transitionTo: TransitionTo<D>) => Automata<C, A>;

export interface StateLifecycle<D> {
  onExit?: (state: D) => void;
  onEnter?: (state: D) => void;
  transitions?: {
    [stateName: string]: (state: D) => boolean;
  };
}

export type StateLifecycleCallback<D> = (state: D) => StateLifecycle<D>;

export interface ActionMap<D> {
  // TODO: I want _any_ object with the correct shaped return value, I dont care about the keys
  // [actionName: string]: (args: {}) => (void | undefined | Partial<D>)
}

export type AutomataCreatorMap<D, C, CA> = {
  [key in keyof (C | CA)]: Automata<C[key], CA[key]> | AutomataCreator<D, C[key], CA[key]>
};

export type StateLifecycleMap<D, S> = {
  [key in keyof S]: StateLifecycle<D> | StateLifecycleCallback<D>
};

export type ActionCreatorMap<D, A extends ActionMap<D>> = {
  [key in keyof A]: (state: D) => A[key]
};
