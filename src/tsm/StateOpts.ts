export interface StateLifecycle<S> {
  onExit?: (state: S) => void;
  onEnter?: (state: S) => void;
  transitions?: {
    [stateName: string]: (state: S) => boolean;
  };
}

export type StateLifecycleCallback<S> = (state: S) => StateLifecycle<S>;
