import { AutomataBuilder } from "../automata/AutomataBuilder";
import { Card, PlayerMap, Trick } from "../types";
import { handIsFinished, trickIsFinished } from "../utils/gameUtils";
import { last } from "../utils/last";

export enum PlayStates {
  Lead = "Lead",
  Follow = "Follow",
  Done = "Done",
}

export interface PlayData {
  tricks: Trick[];
  hands: PlayerMap<Card[]>;
}

export interface PlayActions {
  lead(playerName: string, card: Card): void;
  follow(playerName: string, card: Card): void;
}

export interface PlayOpts {
  hands: PlayerMap<Card[]>;
  chargedCards: Card[];
  onFinish: (tricks: Trick[]) => void;
}

export const PlayAutomata = {
  create(opts: PlayOpts) {
    return new AutomataBuilder<PlayData>({
      tricks: [],
      hands: opts.hands,
    })
      .withStates({
        Lead: {
          transitions: {
            [PlayStates.Follow]: (data: PlayData) => last(data.tricks).plays.length === 1,
          },
        },
        Follow: {
          transitions: {
            [PlayStates.Lead]: (data: PlayData) =>
              trickIsFinished(last(data.tricks).plays) &&
              !handIsFinished(data.tricks.map(trick => trick.plays)),

            [PlayStates.Done]: (data: PlayData) =>
              trickIsFinished(last(data.tricks).plays) &&
              handIsFinished(data.tricks.map(trick => trick.plays)),
          },
        },
        Done: {
          onEnter: (data: PlayData) => opts.onFinish(data.tricks),
        },
      })
      .withActions({
        lead: (data: PlayData) => (payload: { playerName: string; card: Card }) => {
          // TODO : check valid lead.
          return {
            tricks: data.tricks.concat([
              {
                leadBy: payload.playerName,
                plays: [payload.card],
              },
            ]),
            hands: {
              ...data.hands,
              [payload.playerName]: data.hands[payload.playerName].filter(
                playerCard => payload.card !== playerCard,
              ),
            },
          };
        },
        follow: (data: PlayData) => (payload: { playerName: string; card: Card }) => {
          // TODO : check valid play.
          return {
            tricks: data.tricks.slice(-1).concat([
              {
                leadBy: last(data.tricks).leadBy,
                plays: last(data.tricks).plays.concat([payload.card]),
              },
            ]),
            hands: {
              ...data.hands,
              [payload.playerName]: data.hands[payload.playerName].filter(
                playerCard => payload.card !== playerCard,
              ),
            },
          };
        },
      })
      .initialize(PlayStates.Lead);
  },
};
