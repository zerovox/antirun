import { createHandMachine } from "./state/hand";
import { WaitForPlayersMachine } from "./state/waitForPlayers";
import { createWaitForReadyMachine } from "./state/waitForReady";
import { AutomataBuilder } from "./tsm/AutomataBuilder";
import { PassDirection, PlayerMap } from "./types";
import { shuffle } from "./utils/shuffle";

export enum GameStates {
  WaitingForPlayers = "WaitingForPlayers",
  WaitingForReady = "WaitingForReady",
  PassLeft = "PassLeft",
  PassRight = "PassRight",
  PassAcross = "PassAcross",
  NoPass = "NoPass",
  Done = "Scores",
}

export interface GameState {
  players: string[];
  scores: Array<PlayerMap<number>>;
}

(window as any).sm = new AutomataBuilder<GameState>({
  players: [],
  scores: [],
})
  .withNestedAutomata(GameStates.WaitingForPlayers, (state, emit) =>
    WaitForPlayersMachine.create({
      players: state.players,
      onFull: players => emit(GameStates.WaitingForReady, { players }),
    }),
  )
  .withNestedAutomata(GameStates.WaitingForReady, (state, emit) =>
    createWaitForReadyMachine({
      players: state.players,
      onLeave: player =>
        emit(GameStates.WaitingForPlayers, {
          players: state.players.filter(p => p !== player),
        }),
      onAllReady: () => emit(GameStates.PassLeft, { players: shuffle(state.players) }),
    }),
  )
  .withNestedAutomata(GameStates.PassLeft, (state, emit) =>
    createHandMachine({
      players: state.players,
      passDirection: PassDirection.Left,
      onFinish: (score: PlayerMap<number>) =>
        emit(GameStates.PassRight, { scores: state.scores.concat([score]) }),
    }),
  )
  .withNestedAutomata(GameStates.PassRight, (state, emit) =>
    createHandMachine({
      players: state.players,
      passDirection: PassDirection.Right,
      onFinish: (score: PlayerMap<number>) =>
        emit(GameStates.PassAcross, { scores: state.scores.concat([score]) }),
    }),
  )
  .withNestedAutomata(GameStates.PassAcross, (state, emit) =>
    createHandMachine({
      players: state.players,
      passDirection: PassDirection.Across,
      onFinish: (score: PlayerMap<number>) =>
        emit(GameStates.NoPass, { scores: state.scores.concat([score]) }),
    }),
  )
  .withNestedAutomata(GameStates.NoPass, (state, emit) =>
    createHandMachine({
      players: state.players,
      passDirection: PassDirection.None,
      onFinish: (score: PlayerMap<number>) =>
        emit(GameStates.Done, { scores: state.scores.concat([score]) }),
    }),
  )
  .withState(GameStates.Done)
  .initialize(GameStates.WaitingForPlayers)
  .subscribe(state => console.log(state));
