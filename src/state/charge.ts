import { StateMachineBuilder } from "../tsm/StateMachineBuilder";
import { Card, PlayerMap } from "../types";



export interface ChargeState {
    charges: PlayerMap<Card[]>;
    passes: PlayerMap<boolean>;
}

export function createChargeMachine(opts: {

}) {
    return new StateMachineBuilder<ChargeState>()
        .withMachine()
}
