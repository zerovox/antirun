import { makeObject } from "../utils/makeObject";
import { Emitter } from "./Emitter";
import {
  StateMachine,
  StateMachineCreator,
  StateMachineState,
  StateMachineSubscription,
} from "./StateMachine";
import { StateLifecycle, StateLifecycleCallback } from "./StateOpts";

interface Machine<S> {
  name: string;
  machine: StateMachine<StateMachineState<{}, {}, {}>> | undefined;
  lifecycle: StateLifecycle<S>;
}

interface MachineCreator<S, C extends StateMachineState<{}, {}, {}>> {
  lifecycle: StateLifecycleCallback<S>;
  machine: undefined | StateMachineCreator<S, C>;
}

type StateUpdater<S> = undefined | Partial<S> | ((state: S) => Partial<S> | undefined);
type ActionCreator<O, S> = (args: O) => StateUpdater<S>;

export class StateMachineBuilder<S extends {} = {}, T = never, A extends {} = {}> {
  private machineCreators: {
    [name: string]: MachineCreator<S, StateMachineState<{}, {}, {}>>;
  } = {};
  private actionCreators: { [name: string]: ActionCreator<{}, {}> } = {};

  constructor(private initialState: S) {}

  public withMachine<N extends string>(
    stateName: N,
    lifecycle?: StateLifecycle<S> | StateLifecycleCallback<S>,
  ): StateMachineBuilder<S, T, A> {
    if (!lifecycle) {
      this.machineCreators[stateName] = {
        lifecycle: () => ({}),
        machine: undefined,
      };
    } else if (typeof lifecycle === "function") {
      this.machineCreators[stateName] = { lifecycle, machine: undefined };
    } else {
      this.machineCreators[stateName] = {
        lifecycle: () => lifecycle,
        machine: undefined,
      };
    }
    return this;
  }

  public withSubmachine<N extends string, C extends StateMachineState<{}, {}, {}>>(
    stateName: N,
    machineFn: StateMachine<C> | StateMachineCreator<S, C>,
    lifecycle?: StateLifecycle<S> | StateLifecycleCallback<S>,
  ): StateMachineBuilder<S, T | { name: N; state: C }, A> {
    const machine = typeof machineFn === "function" ? machineFn : () => machineFn;
    if (!lifecycle) {
      this.machineCreators[stateName] = {
        lifecycle: () => ({}),
        machine,
      };
    } else if (typeof lifecycle === "function") {
      this.machineCreators[stateName] = { lifecycle, machine };
    } else {
      this.machineCreators[stateName] = { lifecycle: () => lifecycle, machine };
    }
    return this;
  }

  public actions<G, K extends { [s: string]: (opts: any) => StateUpdater<S> } = {}>(
    actions: K,
  ): StateMachineBuilder<S, T, G> {
    this.actionCreators = actions;
    return this as any;
  }

  public initialize(stateName: string): StateMachine<StateMachineState<S, T, A>> {
    const stateMachine = new StateMachineImpl<S, T, A>(
      this.initialState,
      this.machineCreators,
      this.actionCreators,
    );

    stateMachine.transitionToState(stateName);

    return stateMachine;
  }
}

class StateMachineImpl<S extends {}, T, A extends {}>
  implements StateMachine<StateMachineState<S, T, A>> {
  private actions: A;
  private currentMachine: undefined | Machine<{}> = undefined;
  private subscriptions: Array<StateMachineSubscription<StateMachineState<S, T, A>>> = [];

  constructor(
    private state: S,
    private machineCreators: {
      [name: string]: MachineCreator<S, StateMachineState<{}, {}, {}>>;
    },
    actionCreators: {
      [name: string]: ActionCreator<any, S>;
    },
  ) {
    this.actions = makeObject(Object.keys(actionCreators), key => (arg: any) => {
      const updater = actionCreators[key](arg);
      const update = typeof updater === "function" ? updater(this.state) : updater;
      if (!update) {
        return;
      }
      this.setState(state);
      this.update();
    }) as any;
  }

  public getState(): StateMachineState<S, T, A> {
    const machine: T = this.currentMachine
      ? ({
          name: this.currentMachine.name,
          state: this.currentMachine.machine ? this.currentMachine.machine.getState() : undefined,
        } as any)
      : (undefined as any);

    return {
      state: this.state,
      machine,
      actions: this.actions,
    };
  }

  public subscribe(cb: StateMachineSubscription<StateMachineState<S, T, A>>): this {
    this.subscriptions.push(cb);
    return this;
  }

  public transitionToState(stateName: string): boolean {
    if (this.currentMachine !== undefined && this.currentMachine.name === stateName) {
      return false;
    }

    if (this.currentMachine !== undefined && this.currentMachine.lifecycle.onExit) {
      this.currentMachine.lifecycle.onExit(this.state);
    }

    this.currentMachine = this.createState(stateName);

    if (this.currentMachine !== undefined && this.currentMachine.lifecycle.onEnter) {
      this.currentMachine.lifecycle.onEnter(this.state);
    }

    this.update();
    return true;
  }

  private createState(stateName: string): Machine<{}> {
    // TODO : maybe null?
    const machineCreator = this.machineCreators[stateName];
    const lifecycle = machineCreator.lifecycle(this.state);

    return {
      name: stateName,
      lifecycle,
      machine: machineCreator.machine ? this.makeMachine(machineCreator.machine) : undefined,
    };
  }

  private makeMachine(creator: StateMachineCreator<S, StateMachineState<{}, {}, {}>>) {
    const machine = creator(this.state, this.emitter);
    machine.subscribe(() => this.update());
    return machine;
  }

  private update() {
    const state = this.getState();
    this.subscriptions.forEach(cb => cb(state));
  }

  private setState(update: Partial<S>) {
    this.state = { ...(this.state as any), ...(update as any) };
    // TODO: check transitions. fire update if no transition. return true if update fired.
  }

  private emitter: Emitter<S> = (stateName: string, state: Partial<S>) => {
    this.setState(state);
    if (!this.transitionToState(stateName)) {
      this.update();
    }
  };
}
