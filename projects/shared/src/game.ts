import { Card, PlayerMap, Trick } from "./cards";

export enum PassDirection {
  Left = "Left",
  Right = "Right",
  Across = "Across",
  None = "None",
}

export type HandPhase =
  | { phase: "pass"; passed: PlayerMap<boolean> }
  | { phase: "charge"; ready: PlayerMap<boolean> }
  | { phase: "play" }
  | { phase: "score" };

export interface HandState {
  phase: HandPhase;
  charges: PlayerMap<Card[]>;
  hands: PlayerMap<Card[]>;
  tricks: Trick[];
  score: PlayerMap<number>;
}

export type GamePhase =
  | { phase: "pre-game"; readyPlayers: PlayerMap<boolean> }
  | { phase: "game"; hands: HandState[] };

export interface GameState {
  players: string[];
  game: GamePhase;
}
