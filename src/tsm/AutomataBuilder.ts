import { makeObject } from "../utils/makeObject";
import { Automata, AutomataCreator, AutomataState, AutomataSubscription } from "./Automata";
import { StateLifecycle, StateLifecycleCallback } from "./AutomataLifecycle";
import { Emitter } from "./Emitter";

interface CreatedState<D> {
  name: string;
  state: Automata<AutomataState<{}, {}, {}>> | undefined;
  lifecycle: StateLifecycle<D>;
}

interface StateCreator<D, C extends AutomataState<{}, {}, {}>> {
  lifecycle: StateLifecycleCallback<D>;
  automataCreator: undefined | AutomataCreator<D, C>;
}

type DataUpdater<D> = undefined | Partial<D> | ((state: D) => Partial<D> | undefined);
type ActionCreator<O, S> = (args: O) => DataUpdater<S>;

export class AutomataBuilder<D extends {} = {}, C = never, A extends {} = {}> {
  private stateCreator: {
    [name: string]: StateCreator<D, AutomataState<{}, {}, {}>>;
  } = {};
  private actionCreators: { [name: string]: ActionCreator<{}, {}> } = {};

  constructor(private initialData: D) {}

  public withState<N extends string>(
    stateName: N,
    lifecycle?: StateLifecycle<D> | StateLifecycleCallback<D>,
  ): AutomataBuilder<D, C, A> {
    const automataCreator: undefined = undefined;
    if (!lifecycle) {
      this.stateCreator[stateName] = {
        lifecycle: () => ({}),
        automataCreator,
      };
    } else if (typeof lifecycle === "function") {
      this.stateCreator[stateName] = { lifecycle, automataCreator };
    } else {
      this.stateCreator[stateName] = {
        lifecycle: () => lifecycle,
        automataCreator,
      };
    }
    return this;
  }

  public withNestedAutomata<N extends string, NC extends AutomataState<{}, {}, {}>>(
    stateName: N,
    nestedAutomata: Automata<NC> | AutomataCreator<D, NC>,
    lifecycle?: StateLifecycle<D> | StateLifecycleCallback<D>,
  ): AutomataBuilder<D, C | { state: N; frame: NC }, A> {
    const automataCreator =
      typeof nestedAutomata === "function" ? nestedAutomata : () => nestedAutomata;
    if (!lifecycle) {
      this.stateCreator[stateName] = {
        lifecycle: () => ({}),
        automataCreator,
      };
    } else if (typeof lifecycle === "function") {
      this.stateCreator[stateName] = { lifecycle, automataCreator };
    } else {
      this.stateCreator[stateName] = { lifecycle: () => lifecycle, automataCreator };
    }
    return this;
  }

  public actions<G, K extends { [s: string]: (opts: any) => DataUpdater<D> } = {}>(
    actions: K,
  ): AutomataBuilder<D, C, G> {
    this.actionCreators = actions;
    return this as any;
  }

  public initialize(stateName: string): Automata<AutomataState<D, C, A>> {
    const stateMachine = new AutomataImpl<any, C, A>(
      this.initialData,
      this.stateCreator,
      this.actionCreators,
    );

    stateMachine.transitionToState(stateName);

    return stateMachine;
  }
}

class AutomataImpl<D extends { state: string; frame: {} }, T, A extends {}>
  implements Automata<AutomataState<D, T, A>> {
  private actions: A;
  private currentState: undefined | CreatedState<{}> = undefined;
  private subscriptions: Array<AutomataSubscription<AutomataState<D, T, A>>> = [];

  constructor(
    private data: D,
    private stateCreators: {
      [name: string]: StateCreator<D, AutomataState<{}, {}, {}>>;
    },
    actionCreators: {
      [name: string]: ActionCreator<any, D>;
    },
  ) {
    this.actions = makeObject(Object.keys(actionCreators), key => (arg: any) => {
      const updater = actionCreators[key](arg);
      const update = typeof updater === "function" ? updater(this.data) : updater;
      if (!update) {
        return;
      }
      this.setData(data);
      this.update();
    }) as any;
  }

  public getCurrentState(): AutomataState<D, T, A> {
    const frame: T = this.currentState
      ? this.currentState.state ? this.currentState.state.getCurrentState() : undefined
      : (undefined as any);

    return {
      state: this.currentState ? this.currentState.name : (undefined! as string),
      data: this.data,
      frame,
      actions: this.actions,
    } as any;
  }

  public subscribe(cb: AutomataSubscription<AutomataState<D, T, A>>): this {
    this.subscriptions.push(cb);
    return this;
  }

  public transitionToState(stateName: string): boolean {
    if (this.currentState !== undefined && this.currentState.name === stateName) {
      return false;
    }

    if (this.currentState !== undefined && this.currentState.lifecycle.onExit) {
      this.currentState.lifecycle.onExit(this.data);
    }

    this.currentState = this.createState(stateName);

    if (this.currentState !== undefined && this.currentState.lifecycle.onEnter) {
      this.currentState.lifecycle.onEnter(this.data);
    }

    this.update();
    return true;
  }

  private createState(stateName: string): CreatedState<{}> {
    // TODO : maybe null?
    const stateCreator = this.stateCreators[stateName];
    const lifecycle = stateCreator.lifecycle(this.data);

    return {
      name: stateName,
      lifecycle,
      state: stateCreator.automataCreator
        ? this.makeMachine(stateCreator.automataCreator)
        : undefined,
    };
  }

  private makeMachine(creator: AutomataCreator<D, AutomataState<{}, {}, {}>>) {
    const machine = creator(this.data, this.emitter);
    machine.subscribe(() => this.update());
    return machine;
  }

  private update() {
    const state = this.getCurrentState();
    this.subscriptions.forEach(cb => cb(state));
  }

  private setData(update: Partial<D>) {
    this.data = { ...(this.data as any), ...(update as any) };
    // TODO: check transitions. fire update if no transition. return true if update fired.
  }

  private emitter: Emitter<D> = (stateName: string, state: Partial<D>) => {
    this.setData(state);
    if (!this.transitionToState(stateName)) {
      this.update();
    }
  };
}
