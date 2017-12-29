import { makeObject } from "../utils/makeObject";
import {
  ActionCreatorMap,
  ActionMap,
  Automata,
  AutomataCreator,
  AutomataCreatorMap,
  AutomataSubscription,
  StateLifecycle,
  StateLifecycleCallback,
  StateLifecycleMap,
  TransitionTo,
} from "./types";

interface CreatedState<D, C, CA> {
  name: string;
  state: Automata<C, CA> | undefined;
  lifecycle: StateLifecycle<D>;
  destroy: undefined | (() => void);
}

interface StateCreator<D, C, CA> {
  lifecycle: StateLifecycleCallback<D>;
  automataCreator: undefined | AutomataCreator<D, C, CA>;
}

export class AutomataBuilder<D, C = {}, A extends ActionMap<D> = {}> {
  private stateCreator: {
    [name: string]: StateCreator<D, any, any>;
  } = {};
  private actionCreators: ActionCreatorMap<D, A> = {} as any;

  constructor(private initialData: D) {}

  public withStates<S>(statesMap: StateLifecycleMap<D, S>): AutomataBuilder<D, C, A> {
    Object.keys(statesMap).forEach((stateName: keyof S) => {
      const lifecycle = statesMap[stateName];
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
    });
    return this;
  }

  public withNestedStates<NC = {}, NCA = {}>(
    nestedStateMap: AutomataCreatorMap<D, NC, NCA>,
  ): AutomataBuilder<D, C & NC, A & Partial<NCA>> {
    Object.keys(nestedStateMap).forEach((stateName: keyof (NC | NCA)) => {
      const nestedAutomata = nestedStateMap[stateName];
      const automataCreator =
        typeof nestedAutomata === "function" ? nestedAutomata : () => nestedAutomata;
      this.stateCreator[stateName] = {
        lifecycle: () => ({}),
        automataCreator,
      };
    });
    return this as any;
  }

  public withActions<NA extends ActionMap<D>>(
    actions: ActionCreatorMap<D, NA>,
  ): AutomataBuilder<D, C, A & NA> {
    // TODO : replace with reduxy eventys.
    this.actionCreators = {
      ...(this.actionCreators as any),
      ...(actions as any),
    };
    return this as any;
  }

  public initialize(stateName: string): Automata<D & Partial<C>, A> {
    const stateAutomata = new AutomataImpl<D, A>(
      this.initialData,
      this.stateCreator,
      this.actionCreators,
    );

    stateAutomata.transitionToState(stateName);

    return stateAutomata;
  }
}

class AutomataImpl<D, A extends ActionMap<D>> implements Automata<D, A> {
  private actions: A;
  private currentState: undefined | CreatedState<D, any, any> = undefined;
  private subscriptions: Array<AutomataSubscription<D, A>> = [];

  constructor(
    private data: D,
    private stateCreators: {
      [name: string]: StateCreator<D, {}, {}>;
    },
    actionCreators: ActionCreatorMap<D, A>,
  ) {
    this.actions = makeObject(Object.keys(actionCreators), (key: keyof A) => (arg: any) => {
      const updater = actionCreators[key];
      const update = updater(this.data)(arg);
      if (!update) {
        return;
      }
      if (this.setData(update)) {
        return;
      }
      this.update();
    }) as any;
  }

  public getData(): D {
    const frame: any = this.currentState
      ? this.currentState.state
        ? { [this.currentState.name]: this.currentState.state.getData() }
        : { [this.currentState.name]: {} }
      : {};

    return {
      ...(this.data as any),
      ...frame,
    };
  }

  public getActions(): A {
    return {
      ...(this.actions as any),
      ...this.currentState && this.currentState.state ? this.currentState.state.getActions() : {},
    };
  }

  public subscribe(cb: AutomataSubscription<D, A>): () => void {
    this.subscriptions.push(cb);
    return () => {
      this.subscriptions = this.subscriptions.filter(sub => sub !== cb);
    };
  }

  public transitionToState(stateName: string): boolean {
    if (this.currentState !== undefined && this.currentState.name === stateName) {
      return false;
    }

    if (this.currentState !== undefined && this.currentState.lifecycle.onExit) {
      this.currentState.lifecycle.onExit(this.data);
    }

    if (this.currentState !== undefined && this.currentState.destroy) {
      this.currentState.destroy();
    }

    this.currentState = this.createState(stateName);

    if (this.currentState !== undefined && this.currentState.lifecycle.onEnter) {
      this.currentState.lifecycle.onEnter(this.data);
    }

    this.update();
    return true;
  }

  private createState(stateName: string): CreatedState<{}, {}, {}> {
    const stateCreator = this.stateCreators[stateName];
    if (!stateCreator) {
      throw new Error(`No State with name ${stateName} found`);
    }
    const lifecycle = stateCreator.lifecycle(this.data);
    const automata = stateCreator.automataCreator
      ? this.makeAutomata(stateCreator.automataCreator)
      : undefined;

    return {
      name: stateName,
      lifecycle,
      state: automata ? automata.automata : undefined,
      destroy: automata ? automata.destroy : undefined,
    };
  }

  private makeAutomata(creator: AutomataCreator<D, {}, {}>) {
    const automata = creator(this.data, this.transitionTo);
    const unsubscribe = automata.subscribe(() => this.update());
    return { automata, destroy: unsubscribe };
  }

  private update() {
    const state = this.getData();
    // TODO : union in deep actions here
    const actions = this.getActions();
    this.subscriptions.forEach(cb => cb(state, actions));
  }

  private setData(update: Partial<D>) {
    this.data = { ...(this.data as any), ...(update as any) };
    const transitions = this.currentState ? this.currentState.lifecycle.transitions : undefined;
    if (transitions) {
      const nextStateName = Object.keys(transitions).find(stateName =>
        transitions[stateName](this.data),
      );
      if (nextStateName) {
        return this.transitionToState(nextStateName);
      }
    }
    return false;
  }

  private transitionTo: TransitionTo<D> = (stateName: string, state: Partial<D>) => {
    if (this.setData(state)) {
      return;
    }
    if (this.transitionToState(stateName)) {
      return;
    }
    this.update();
  };
}
