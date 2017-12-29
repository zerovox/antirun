import { HandAutomata } from "./state/hand";
import { WaitForPlayersActions, WaitForPlayersAutomata } from "./state/waitForPlayers";
import { WaitForReadyActions, WaitForReadyAutomata, WaitForReadyData } from "./state/waitForReady";
import { AutomataBuilder } from "./tsm/AutomataBuilder";
import { PassDirection, PlayerMap } from "./types";
import { shuffle } from "./utils/shuffle";
import { AutomataState } from "./tsm/Automata";

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
  .withNestedAutomata(GameStates.WaitingForPlayers, (state, transitionTo) =>
    WaitForPlayersAutomata.create({
      players: state.players,
      onFull: players => transitionTo(GameStates.WaitingForReady, { players }),
    })
  )
  .withNestedAutomata(GameStates.WaitingForReady, (state, transitionTo) =>
    WaitForReadyAutomata.create({
      players: state.players,
      onLeave: player =>
        transitionTo(GameStates.WaitingForPlayers, {
          players: state.players.filter(p => p !== player),
        }),
      onAllReady: () => transitionTo(GameStates.PassLeft, { players: shuffle(state.players) }),
    }),
  )
  .withNestedAutomata(GameStates.PassLeft, (state, transitionTo) =>
    HandAutomata.create({
      players: state.players,
      passDirection: PassDirection.Left,
      onFinish: (score: PlayerMap<number>) =>
        transitionTo(GameStates.PassRight, { scores: state.scores.concat([score]) }),
    }),
  )
  .withNestedAutomata(GameStates.PassRight, (state, transitionTo) =>
    HandAutomata.create({
      players: state.players,
      passDirection: PassDirection.Right,
      onFinish: (score: PlayerMap<number>) =>
        transitionTo(GameStates.PassAcross, { scores: state.scores.concat([score]) }),
    }),
  )
  .withNestedAutomata(GameStates.PassAcross, (state, transitionTo) =>
    HandAutomata.create({
      players: state.players,
      passDirection: PassDirection.Across,
      onFinish: (score: PlayerMap<number>) =>
        transitionTo(GameStates.NoPass, { scores: state.scores.concat([score]) }),
    }),
  )
  .withNestedAutomata(GameStates.NoPass, (state, transitionTo) =>
    HandAutomata.create({
      players: state.players,
      passDirection: PassDirection.None,
      onFinish: (score: PlayerMap<number>) =>
        transitionTo(GameStates.Done, { scores: state.scores.concat([score]) }),
    }),
  )
  .withState(GameStates.Done)
  .initialize(GameStates.WaitingForPlayers)
  .subscribe(state => {
      console.log(state);
      
      if (state.state === GameStates.WaitingForPlayers) {
          const actions = state.frame.actions as WaitForPlayersActions;
          actions.join("Player " + (state.frame.players.length + 1));
      }
      if (state.state === GameStates.WaitingForReady) {
          const actions = state.frame.actions as WaitForReadyActions;
          const data = state.frame as WaitForReadyData;
          const readyPlayerCount = state.players
              .reduce((count, name) => count + (data[name] ? 1 : 0), 0);
          actions.ready(state.players[readyPlayerCount]);
      }
  });
