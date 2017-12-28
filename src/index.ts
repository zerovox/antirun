import { PassDirection } from "./types";
import { createHandMachine } from "./state/hand";
import { WaitForPlayersMachine } from "./state/waitForPlayers";
import { createWaitForReadyMachine } from "./state/waitForReady";
import { StateMachineBuilder } from "./tsm/StateMachineBuilder";
import { shuffle } from "./utils/shuffle";

export enum GameStates {
  WaitingForPlayers = "WaitingForPlayers",
  WaitingForReady = "WaitingForReady",
  PassLeft = "PassLeft",
  PassRight = "PassRight",
  PassAcross = "PassAcross",
  NoPass = "NoPass",
  Scores = "Scores",
}

export interface GameState {
  players: string[];
  scores: number[][];
}

(window as any).sm = new StateMachineBuilder<GameState>({
  players: [],
  scores: [],
})
  .withSubmachine(GameStates.WaitingForPlayers, (state, emit) =>
    WaitForPlayersMachine.create({
      players: state.players,
      onFull: players => emit(GameStates.WaitingForReady, { players }),
    }),
  )
  .withSubmachine(GameStates.WaitingForReady, (state, emit) =>
    createWaitForReadyMachine({
      players: state.players,
      onLeave: player =>
        emit(GameStates.WaitingForPlayers, {
          players: state.players.filter(p => p !== player),
        }),
      onAllReady: () => emit(GameStates.PassLeft, { players: shuffle(state.players) }),
    }),
  )
  .withSubmachine(GameStates.PassLeft, (state, emit) =>
    createHandMachine({
    players: state.players,
      passDirection: PassDirection.Left,
      onFinish: (score: number[]) =>
        emit(GameStates.PassRight, { scores: state.scores.concat([score]) }),
    }),
  )
  .withSubmachine(GameStates.PassRight, (state, emit) =>
    createHandMachine({
        players: state.players,
      passDirection: PassDirection.Right,
      onFinish: (score: number[]) =>
        emit(GameStates.PassAcross, { scores: state.scores.concat([score]) }),
    }),
  )
  .withSubmachine(GameStates.PassAcross, (state, emit) =>
    createHandMachine({
        players: state.players,
      passDirection: PassDirection.Across,
      onFinish: (score: number[]) =>
        emit(GameStates.NoPass, { scores: state.scores.concat([score]) }),
    }),
  )
  .withSubmachine(GameStates.NoPass, (state, emit) =>
    createHandMachine({
        players: state.players,
      passDirection: PassDirection.None,
      onFinish: (score: number[]) =>
        emit(GameStates.Scores, { scores: state.scores.concat([score]) }),
    }),
  )
  .withMachine(GameStates.Scores)
  .initialize(GameStates.WaitingForPlayers)
  .subscribe(state => console.log(state));
