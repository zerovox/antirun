export type Emitter<S> = (stateName: string, state?: Partial<S>) => void;
