import {
  Card,
  cardEquals,
  GameView,
  GameViewPhase,
  handIsFinished,
  HandView,
  last,
  makeObject,
  PassDirection,
  PlayerMap,
  scoreHand,
  segment,
  shuffle,
  Trick,
  trickIsFinished,
} from "@tsm/shared";
import { ALL_CARDS, applyPasses, TWO_OF_CLUBS } from "./cards";

enum GamePhase {
  WAITING_FOR_PLAYERS = "WAITING_FOR_PLAYERS",
  WAITING_FOR_READY = "WAITING_FOR_READY",
  PASSING = "PASSING",
  CHARGING = "CHARGING",
  PLAYING = "PLAYING",
  SCORES = "SCORES",
}

interface Transition {
  from: GamePhase;
  to: GamePhase;
  predicate: () => boolean;
  onTransition?: () => void;
}

interface HandState {
  hands: PlayerMap<Card[]>;
  passes: PlayerMap<[Card, Card, Card] | undefined>;
  chargedCards: PlayerMap<Card[]>;
  readyPlayers: PlayerMap<boolean>;
  tricks: Trick[];
}

export class TurboHeartsGame {
  private phase: GamePhase = GamePhase.WAITING_FOR_PLAYERS;
  private subscriptions: Array<{ cb: (cb: GameView) => void; user: string }> = [];

  private players: string[] = [];
  private readyPlayers: PlayerMap<boolean> = {};
  private hands: HandState[] = [];
  private get currentHand() {
    return last(this.hands);
  }

  private transitions: Transition[] = [
    {
      from: GamePhase.WAITING_FOR_PLAYERS,
      to: GamePhase.WAITING_FOR_READY,
      predicate: () => this.players.length === 4,
    },
    {
      from: GamePhase.WAITING_FOR_READY,
      to: GamePhase.WAITING_FOR_PLAYERS,
      predicate: () => this.players.length !== 4,
      onTransition: () => {
        this.readyPlayers = {};
      },
    },
    {
      from: GamePhase.WAITING_FOR_READY,
      to: GamePhase.PASSING,
      predicate: () => this.players.every(player => this.readyPlayers[player]),
      onTransition: () => {
        this.players = shuffle(this.players);
        this.hands.push(createHand(this.players));
      },
    },
    {
      from: GamePhase.PASSING,
      to: GamePhase.CHARGING,
      predicate: () => this.players.every(player => this.currentHand.passes[player] !== undefined),
      onTransition: () => {
        const passDirection = ((dir: number) => {
          switch (dir) {
            case 1:
              return PassDirection.Left;
            case 2:
              return PassDirection.Right;
            case 3:
              return PassDirection.Across;
            default:
              return PassDirection.None;
          }
        })(this.hands.length);
        const { hands, passes } = this.currentHand;
        this.currentHand.hands = applyPasses(hands, passes, this.players, passDirection);
        this.currentHand.readyPlayers = makeObject(this.players, () => false);
      },
    },
    {
      from: GamePhase.CHARGING,
      to: GamePhase.PLAYING,
      predicate: () =>
        this.players.reduce(
          (count, player) => count + this.currentHand.chargedCards[player].length,
          0,
        ) === 4 || this.players.every(player => this.currentHand.readyPlayers[player]),
      onTransition: () => {
        const { hands } = this.currentHand;
        const firstPlayer = this.players.find(
          player => hands[player].findIndex(card => cardEquals(card, TWO_OF_CLUBS)) !== -1,
        )!;

        this.currentHand.tricks = [
          {
            leadBy: firstPlayer,
            plays: [TWO_OF_CLUBS],
          },
        ];

        this.currentHand.hands = {
          ...hands,
          [firstPlayer]: hands[firstPlayer].filter(card => !cardEquals(card, TWO_OF_CLUBS)),
        };
      },
    },
    {
      from: GamePhase.PLAYING,
      to: GamePhase.PASSING,
      predicate: () =>
        handIsFinished(this.currentHand.tricks.map(trick => trick.plays)) && this.hands.length < 3,
      onTransition: () => {
        this.hands.push(createHand(this.players));
      },
    },
    {
      from: GamePhase.PLAYING,
      to: GamePhase.CHARGING,
      predicate: () =>
        handIsFinished(this.currentHand.tricks.map(trick => trick.plays)) &&
        this.hands.length === 3,
      onTransition: () => {
        this.hands.push(createHand(this.players));
      },
    },
    {
      from: GamePhase.PLAYING,
      to: GamePhase.SCORES,
      predicate: () =>
        handIsFinished(this.currentHand.tricks.map(trick => trick.plays)) &&
        this.hands.length === 4,
    },
  ];

  public join(player: string) {
    this.inPhase(GamePhase.WAITING_FOR_PLAYERS, () => {
      if (this.players.includes(player)) {
        return;
      }
      this.players.push(player);
    });
  }

  public leave(player: string) {
    this.inPhase([GamePhase.WAITING_FOR_PLAYERS, GamePhase.WAITING_FOR_READY], () => {
      this.players.splice(this.players.indexOf(player), 1);
    });
  }

  public ready(player: string) {
    this.inPhase(GamePhase.WAITING_FOR_READY, () => {
      this.readyPlayers[player] = true;
    });
  }

  public unready(player: string) {
    this.inPhase(GamePhase.WAITING_FOR_READY, () => {
      this.readyPlayers[player] = false;
    });
  }

  public pass(player: string, cards: Card[]) {
    this.inPhase(GamePhase.PASSING, () => {
      // TODO : validate pass length
      this.currentHand.passes[player] = cards as [Card, Card, Card];
      this.currentHand.readyPlayers[player] = true;
    });
  }

  public charge(player: string, card: Card) {
    this.inPhase(GamePhase.CHARGING, () => {
      // TODO: validate charges
      this.currentHand.chargedCards[player].push(card);
      this.currentHand.readyPlayers = makeObject(this.players, () => false);
    });
  }

  public skipCharge(player: string) {
    this.inPhase(GamePhase.CHARGING, () => {
      this.currentHand.readyPlayers[player] = true;
    });
  }

  public play(player: string, card: Card) {
    this.inPhase(GamePhase.PLAYING, () => {
      // TODO : validate play
      const trick = last(this.currentHand.tricks);
      if (trickIsFinished(trick.plays)) {
        this.currentHand.tricks.push({
          leadBy: player,
          plays: [card],
        });
      } else {
        trick.plays.push(card);
      }
      this.currentHand.hands[player].splice(
        this.currentHand.hands[player].findIndex(c => cardEquals(c, card)),
        1,
      );
    });
  }

  public subscribe(user: string, cb: (gameState: GameView) => void): () => void {
    const sub = {
      cb,
      user,
    };
    this.subscriptions.push(sub);
    return () => this.subscriptions.splice(this.subscriptions.indexOf(sub), 1);
  }

  public getViewForUser(user: string) {
    const game: GameViewPhase =
      this.phase === GamePhase.WAITING_FOR_PLAYERS || this.phase === GamePhase.WAITING_FOR_READY
        ? { phase: "pre-game", readyPlayers: this.readyPlayers }
        : {
            phase: "game",
            hands: this.hands.map(hand => this.getPlayerHandView(hand, user)),
          };

    return {
      players: this.players,
      game,
    };
  }

  private inPhase(phase: GamePhase | GamePhase[], act: () => void) {
    if (Array.isArray(phase) ? phase.includes(this.phase) : this.phase !== phase) {
      throw new Error(`Expected phase ${phase} but was ${this.phase}`);
    }
    act();
    const transition = this.transitions.find(t => t.from === this.phase && t.predicate());
    if (transition) {
      this.phase = transition.to;
      if (transition.onTransition) {
        transition.onTransition();
      }
    }
    this.subscriptions.forEach(sub => sub.cb(this.getViewForUser(sub.user)));
  }

  private getPlayerHandView(hand: HandState, player: string): HandView {
    const handPhase = (phase => {
      if (hand !== this.currentHand) {
        return "score";
      }
      switch (phase) {
        case GamePhase.PASSING:
          return "pass";
        case GamePhase.CHARGING:
          return "charge";
        case GamePhase.PLAYING:
          return "play";
        case GamePhase.SCORES:
          return "score";
        default:
          throw new Error("Unexpected game phase " + phase);
      }
    })(this.phase);

    return {
      phase: handPhase,
      readyPlayers: hand.readyPlayers,
      hands: {
        [player]: hand.hands[player],
      },
      // TODO : limit number of tricks shown.
      tricks: hand.tricks,
      charges: hand.chargedCards,
      score: handIsFinished(hand.tricks.map(trick => trick.plays))
        ? scoreHand(hand.tricks, combine(hand.chargedCards), this.players)
        : {},
    };
  }
}

function createHand(players: string[]): HandState {
  const allHands = segment(shuffle(ALL_CARDS), 13);

  return {
    hands: makeObject(players, (_playerName, index) => allHands[index]),
    chargedCards: makeObject(players, () => []),
    tricks: [],
    passes: makeObject(players, () => undefined),
    readyPlayers: makeObject(players, () => false),
  };
}

function combine<T>(obj: { [key: string]: T[] }) {
  return Object.keys(obj).reduce((ts, key) => ts.concat(obj[key]), [] as T[]);
}
