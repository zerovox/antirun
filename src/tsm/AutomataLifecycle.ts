export interface StateLifecycle<D> {
  onExit?: (state: D) => void;
  onEnter?: (state: D) => void;
  transitions?: {
    [stateName: string]: (state: D) => boolean;
  };
}

export type StateLifecycleCallback<D> = (state: D) => StateLifecycle<D>;
