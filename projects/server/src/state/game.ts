import { PassDirection, PlayerMap, shuffle } from "@tsm/shared";
import { AutomataBuilder } from "../automata/AutomataBuilder";
import { Automata, TransitionTo } from "../automata/types";
import { HandActions, HandAutomata, HandData } from "./hand";
import {
  WaitForPlayersActions,
  WaitForPlayersAutomata,
  WaitForPlayersData,
} from "./waitForPlayers";
import { WaitForReadyActions, WaitForReadyAutomata, WaitForReadyData } from "./waitForReady";

export enum GameStates {
  WaitingForPlayers = "WaitingForPlayers",
  WaitingForReady = "WaitingForReady",
  PassLeft = "PassLeft",
  PassRight = "PassRight",
  PassAcross = "PassAcross",
  NoPass = "NoPass",
  Done = "Scores",
}

export interface GameData {
  players: string[];
  scores: Array<PlayerMap<number>>;
}

export interface GameState {
  WaitingForPlayers: WaitForPlayersData;
  WaitingForReady: WaitForReadyData;
  PassLeft: HandData;
  PassRight: HandData;
  PassAcross: HandData;
  NoPass: HandData;
}

export type GameActions = WaitForPlayersActions & WaitForReadyActions & HandActions;

export type TurboHeartsGameAutomata = Automata<GameData & Partial<GameState>, Partial<GameActions>>;

export const TurboHeartsGameAutomata = {
  create() {
    return new AutomataBuilder<GameData>({
      players: [],
      scores: [],
    })
      .withNestedStates<GameState, GameActions>({
        WaitingForPlayers: (state: GameData, transitionTo: TransitionTo<GameData>) =>
          WaitForPlayersAutomata.create({
            players: state.players,
            onFull: players => transitionTo(GameStates.WaitingForReady, { players }),
          }),
        WaitingForReady: (state: GameData, transitionTo: TransitionTo<GameData>) =>
          WaitForReadyAutomata.create({
            players: state.players,
            onLeave: player =>
              transitionTo(GameStates.WaitingForPlayers, {
                players: state.players.filter(p => p !== player),
              }),
            onAllReady: () =>
              transitionTo(GameStates.PassLeft, { players: shuffle(state.players) }),
          }),
        PassLeft: (state: GameData, transitionTo: TransitionTo<GameData>) =>
          HandAutomata.create({
            players: state.players,
            passDirection: PassDirection.Left,
            onFinish: (score: PlayerMap<number>) =>
              transitionTo(GameStates.PassRight, { scores: state.scores.concat([score]) }),
          }),
        PassRight: (state: GameData, transitionTo: TransitionTo<GameData>) =>
          HandAutomata.create({
            players: state.players,
            passDirection: PassDirection.Right,
            onFinish: (score: PlayerMap<number>) =>
              transitionTo(GameStates.PassAcross, { scores: state.scores.concat([score]) }),
          }),
        PassAcross: (state: GameData, transitionTo: TransitionTo<GameData>) =>
          HandAutomata.create({
            players: state.players,
            passDirection: PassDirection.Across,
            onFinish: (score: PlayerMap<number>) =>
              transitionTo(GameStates.NoPass, { scores: state.scores.concat([score]) }),
          }),
        NoPass: (state: GameData, transitionTo: TransitionTo<GameData>) =>
          HandAutomata.create({
            players: state.players,
            passDirection: PassDirection.None,
            onFinish: (score: PlayerMap<number>) =>
              transitionTo(GameStates.Done, { scores: state.scores.concat([score]) }),
          }),
      })
      .withStates({ [GameStates.Done]: {} })
      .initialize(GameStates.WaitingForPlayers);
  },
};
