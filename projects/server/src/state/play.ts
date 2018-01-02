import { cardEquals, Suit, Card, handIsFinished, last,strToRank, PlayerMap, Trick, trickIsFinished } from "@tsm/shared";
import { AutomataBuilder } from "../automata/AutomataBuilder";

const TWO_OF_CLUBS = {
    suit: Suit.Clubs,
    rank: strToRank("2"),
};

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
  lead(payload: { player: string; card: Card }): void;
  follow(payload: { player: string; card: Card }): void;
}

export interface PlayOpts {
  hands: PlayerMap<Card[]>;
  chargedCards: Card[];
  onFinish: (tricks: Trick[]) => void;
}

export const PlayAutomata = {
  create(opts: PlayOpts) {
    const firstPlayer = Object.keys(opts.hands).find(
        player => opts.hands[player].findIndex(card => cardEquals(card, TWO_OF_CLUBS)) !== -1
    )!;
    return new AutomataBuilder<PlayData>({
      tricks: [
          {
              leadBy: firstPlayer,
              plays: [TWO_OF_CLUBS],
          },
      ],
      hands: {
          ...opts.hands,
          [firstPlayer]: opts.hands[firstPlayer].filter(card =>
            !cardEquals(card, TWO_OF_CLUBS),
          ),
      },
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
      .withActions<PlayActions>({
        lead: (data: PlayData) => (payload: { player: string; card: Card }) => {
          // TODO : check valid lead.
          return {
            tricks: data.tricks.concat([
              {
                leadBy: payload.player,
                plays: [payload.card],
              },
            ]),
            hands: {
              ...data.hands,
              [payload.player]: data.hands[payload.player].filter(
                playerCard => payload.card !== playerCard,
              ),
            },
          };
        },
        follow: (data: PlayData) => (payload: { player: string; card: Card }) => {
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
              [payload.player]: data.hands[payload.player].filter(
                playerCard => payload.card !== playerCard,
              ),
            },
          };
        },
      })
      .initialize(PlayStates.Follow);
  },
};
