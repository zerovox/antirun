import {
  ALL_CARDS,
  Card,
  cardEquals,
  CHARGEABLE_CARDS,
  GameView,
  GameViewPhase,
  handIsFinished,
  HandView,
  hasInSuitCard,
  heartsAreBroken,
  isInSuit,
  isPointCard,
  last,
  makeObject,
  nextPlayerInTrick,
  PassDirection,
  PlayerMap,
  scoreHand,
  segment,
  shuffle,
  Suit,
  Trick,
  trickCountOfSuit,
  trickIsFinished,
  TWO_OF_CLUBS,
} from "@tsm/shared";
import { applyPasses } from "./passes";

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
        this.readyPlayers = {};
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
      predicate: () => handIsFinished(this.currentHand.tricks) && this.hands.length < 3,
      onTransition: () => {
        this.hands.push(createHand(this.players));
        this.readyPlayers = {};
      },
    },
    {
      from: GamePhase.PLAYING,
      to: GamePhase.CHARGING,
      predicate: () => handIsFinished(this.currentHand.tricks) && this.hands.length === 3,
      onTransition: () => {
        this.hands.push(createHand(this.players));
      },
    },
    {
      from: GamePhase.PLAYING,
      to: GamePhase.SCORES,
      predicate: () => handIsFinished(this.currentHand.tricks) && this.hands.length === 4,
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
      if (cards.length !== 3) {
        throw new Error("Must pass three cards");
      }
      this.currentHand.passes[player] = cards as [Card, Card, Card];
      this.currentHand.readyPlayers[player] = true;
    });
  }

  public charge(player: string, card: Card) {
    this.inPhase(GamePhase.CHARGING, () => {
      if (!this.currentHand.hands[player].find(c => cardEquals(c, card))) {
        throw new Error("Can only charge cards in players hand");
      }
      if (!CHARGEABLE_CARDS.find(c => cardEquals(card, c))) {
        throw new Error("Can only charge chargable cards");
      }
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
      const { tricks, hands, chargedCards } = this.currentHand;
      const playersHand = hands[player];
      if (!playersHand.find(c => cardEquals(c, card))) {
        throw new Error("Can only play cards in players hand");
      }
      const trick = last(tricks);
      if (trick !== undefined) {
        const nextPlayer = nextPlayerInTrick(trick, this.players);
        if (nextPlayer !== player) {
          throw new Error("Can only play in turn, expected player " + nextPlayer);
        }
      } else {
        if (!cardEquals(card, TWO_OF_CLUBS)) {
          throw new Error("First lead must be two of clubs");
        }
      }

      const isChargedCard = chargedCards[player].find(c => cardEquals(c, card)) !== undefined;

      if (trickIsFinished(trick)) {
        if (
          card.suit === Suit.Hearts &&
          !heartsAreBroken(tricks) &&
          !playersHand.every(c => c.suit === Suit.Hearts)
        ) {
          throw new Error("Must not lead hearts until broken, unless forced");
        }
        if (isChargedCard && trickCountOfSuit(tricks, card.suit) === 0) {
          if (playersHand.filter(c => c.suit === card.suit).length !== 1) {
            throw new Error("Must not play charged card on first trick of suit, unless forced");
          }
        }
        tricks.push({
          leadBy: player,
          plays: [card],
        });
      } else {
        if (tricks.length === 1 && isPointCard(card) && !playersHand.every(c => isPointCard(c))) {
          throw new Error("Must not play point card on first trick, unless forced");
        }
        if (!isInSuit(trick, card) && hasInSuitCard(trick, playersHand)) {
          throw new Error("Must follow lead suit if possible");
        }
        if (isChargedCard && isInSuit(trick, card) && trickCountOfSuit(tricks, card.suit) === 1) {
          if (playersHand.filter(c => c.suit === card.suit).length !== 1) {
            throw new Error("Must not play charged card on first trick of suit, unless forced");
          }
        }
        trick.plays.push(card);
      }
      playersHand.splice(playersHand.findIndex(c => cardEquals(c, card)), 1);
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
    if (Array.isArray(phase) ? !phase.includes(this.phase) : this.phase !== phase) {
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
      tricks: handIsFinished(hand.tricks) ? hand.tricks : hand.tricks.slice(-2),
      charges: hand.chargedCards,
      score: handIsFinished(hand.tricks)
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
