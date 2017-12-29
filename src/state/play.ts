import { AutomataBuilder } from "../tsm/AutomataBuilder";
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
      .withState(PlayStates.Lead, {
        transitions: {
          [PlayStates.Follow]: data => last(data.tricks).plays.length === 1,
        },
      })
      .withState(PlayStates.Follow, {
        transitions: {
          [PlayStates.Lead]: data =>
            trickIsFinished(last(data.tricks).plays) &&
            !handIsFinished(data.tricks.map(trick => trick.plays)),

          [PlayStates.Done]: data =>
            trickIsFinished(last(data.tricks).plays) &&
            handIsFinished(data.tricks.map(trick => trick.plays)),
        },
      })
      .withState(PlayStates.Done, {
        onEnter: data => opts.onFinish(data.tricks),
      })
      .actions<PlayActions>({
        lead: (playerName: string, card: Card) => (data: PlayData) => {
          // TODO : check valid lead.
          return {
            tricks: data.tricks.concat([
              {
                leadBy: playerName,
                plays: [card],
              },
            ]),
            hands: {
              ...data.hands,
              [playerName]: data.hands[playerName].filter(playerCard => card !== playerCard),
            },
          };
        },
        follow: (playerName: string, card: Card) => (data: PlayData) => {
          // TODO : check valid play.
          return {
            tricks: data.tricks.slice(-1).concat([
              {
                leadBy: last(data.tricks).leadBy,
                plays: last(data.tricks).plays.concat([card]),
              },
            ]),
            hands: {
              ...data.hands,
              [playerName]: data.hands[playerName].filter(playerCard => card !== playerCard),
            },
          };
        },
      })
      .initialize(PlayStates.Lead);
  },
};
