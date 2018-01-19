import { Card, PlayerMap, Trick } from "./cards";

export enum PassDirection {
  Left = "Left",
  Right = "Right",
  Across = "Across",
  None = "None",
}

export type HandViewPhase =
  | { phase: "pass"; passed: PlayerMap<boolean> }
  | { phase: "charge"; ready: PlayerMap<boolean> }
  | { phase: "play" }
  | { phase: "score" };

export interface HandView {
  phase: "pass" | "charge" | "play" | "score";
  readyPlayers: PlayerMap<boolean>;
  charges: PlayerMap<Card[]>;
  hands: PlayerMap<Card[]>;
  tricks: Trick[];
  score: PlayerMap<number>;
}

export type GameViewPhase =
  | { phase: "pre-game"; readyPlayers: PlayerMap<boolean> }
  | { phase: "game"; hands: HandView[] };

export interface GameView {
  players: string[];
  game: GameViewPhase;
}

export interface GameList {
  games: Array<{
    id: number;
    phase: "pre-game" | "game" | "post-game";
    hand: PassDirection;
    players: string[];
  }>;
}
