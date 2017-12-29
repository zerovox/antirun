export type TransitionTo<S> = (stateName: string, state?: Partial<S>) => void;
