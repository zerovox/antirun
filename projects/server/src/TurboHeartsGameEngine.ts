import {
  Card,
  cardEquals,
  CHARGEABLE_CARDS,
  combine,
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
  scoreHand,
  shuffle,
  Suit,
  trickCountOfSuit,
  trickIsFinished,
  TWO_OF_CLUBS,
} from "@antirun/shared";
import { GameModel } from "./models/Game";
import { HandModel } from "./models/Hand";
import { applyPasses } from "./passes";

export enum GamePhase {
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
  onTransition?: () => void | Promise<{}>;
}

export class TurboHeartsGameEngine {
  private game: GameModel;
  private subscriptions: Array<{ cb: (cb: GameView) => void; user: string }> = [];

  private get currentHand(): HandModel {
    if (!this.game.hands) {
      throw new Error("Attempted to access hand before hand had been added");
    }
    return last(this.game.hands);
  }

  private transitions: Transition[] = [
    {
      from: GamePhase.WAITING_FOR_PLAYERS,
      to: GamePhase.WAITING_FOR_READY,
      predicate: () => this.game.players.length === 4,
    },
    {
      from: GamePhase.WAITING_FOR_READY,
      to: GamePhase.WAITING_FOR_PLAYERS,
      predicate: () => this.game.players.length !== 4,
      onTransition: () => {
        this.game.setReadyPlayers({});
      },
    },
    {
      from: GamePhase.WAITING_FOR_READY,
      to: GamePhase.PASSING,
      predicate: () => this.game.players.every(player => this.game.readyPlayers[player]),
      onTransition: () => {
        this.game.setPlayers(shuffle(this.game.players));
        this.game.setReadyPlayers({});
        return this.game.createNewHand();
      },
    },
    {
      from: GamePhase.PASSING,
      to: GamePhase.CHARGING,
      predicate: () =>
        this.game.players.every(player => this.currentHand.passes[player] !== undefined),
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
        })(this.game.hands.length);
        const { hands, passes } = this.currentHand;
        this.currentHand.setHands(applyPasses(hands, passes, this.game.players, passDirection));
        this.currentHand.setReadyPlayers(makeObject(this.game.players, () => false));
      },
    },
    {
      from: GamePhase.CHARGING,
      to: GamePhase.PLAYING,
      predicate: () =>
        this.game.players.reduce(
          (count, player) => count + this.currentHand.chargedCards[player].length,
          0,
        ) === 4 || this.game.players.every(player => this.currentHand.readyPlayers[player]),
      onTransition: () => {
        const { hands } = this.currentHand;
        const firstPlayer = this.game.players.find(
          player => hands[player].findIndex(card => cardEquals(card, TWO_OF_CLUBS)) !== -1,
        )!;

        this.currentHand.setTricks([
          {
            leadBy: firstPlayer,
            plays: [TWO_OF_CLUBS],
          },
        ]);

        this.currentHand.setHands({
          ...hands,
          [firstPlayer]: hands[firstPlayer].filter(card => !cardEquals(card, TWO_OF_CLUBS)),
        });
      },
    },
    {
      from: GamePhase.PLAYING,
      to: GamePhase.PASSING,
      predicate: () => handIsFinished(this.currentHand.tricks) && this.game.hands.length < 3,
      onTransition: () => {
        this.game.setReadyPlayers({});
        return this.game.createNewHand();
      },
    },
    {
      from: GamePhase.PLAYING,
      to: GamePhase.CHARGING,
      predicate: () => handIsFinished(this.currentHand.tricks) && this.game.hands.length === 3,
      onTransition: () => {
        this.game.setReadyPlayers({});
        return this.game.createNewHand();
      },
    },
    {
      from: GamePhase.PLAYING,
      to: GamePhase.SCORES,
      predicate: () => handIsFinished(this.currentHand.tricks) && this.game.hands.length === 4,
    },
  ];

  constructor(game: GameModel) {
    this.game = game;
  }

  public join(player: string) {
    this.inPhase(GamePhase.WAITING_FOR_PLAYERS, () => {
      if (this.game.players.includes(player)) {
        return;
      }
      this.game.setPlayers(this.game.players.concat([player]));
    });
  }

  public leave(player: string) {
    this.inPhase([GamePhase.WAITING_FOR_PLAYERS, GamePhase.WAITING_FOR_READY], () => {
      this.game.setPlayers(this.game.players.filter(p => p !== player));
    });
  }

  public ready(player: string) {
    this.inPhase(GamePhase.WAITING_FOR_READY, () => {
      this.game.setReadyPlayers({
        ...this.game.readyPlayers,
        [player]: true,
      });
    });
  }

  public unready(player: string) {
    this.inPhase(GamePhase.WAITING_FOR_READY, () => {
      this.game.setReadyPlayers({
        ...this.game.readyPlayers,
        [player]: false,
      });
    });
  }

  public pass(player: string, cards: Card[]) {
    this.inPhase(GamePhase.PASSING, () => {
      if (cards.length !== 3) {
        throw new Error("Must pass three cards");
      }
      this.currentHand.passes[player] = cards as [Card, Card, Card];
      this.currentHand.setReadyPlayers({
        ...this.currentHand.readyPlayers,
        [player]: true,
      });
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
      this.currentHand.setChargedCards({
        ...this.currentHand.chargedCards,
        [player]: (this.currentHand.chargedCards[player] || []).concat([card]),
      });
      this.currentHand.setReadyPlayers(makeObject(this.game.players, () => false));
    });
  }

  public skipCharge(player: string) {
    this.inPhase(GamePhase.CHARGING, () => {
      this.currentHand.setReadyPlayers({
        ...this.currentHand.readyPlayers,
        [player]: true,
      });
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
        const nextPlayer = nextPlayerInTrick(trick, this.game.players);
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
        this.currentHand.setTricks([
          ...tricks,
          {
            leadBy: player,
            plays: [card],
          },
        ]);
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
        this.currentHand.setTricks([
          ...tricks.slice(0, tricks.length - 1),
          {
            leadBy: trick.leadBy,
            plays: trick.plays.concat([card]),
          },
        ]);
      }
      this.currentHand.setHands({
        ...this.currentHand.hands,
        [player]: playersHand.filter(c => !cardEquals(c, card)),
      });
    });
  }

  // TODO : allow player to claim
  // TODO : skip remaining tricks if no important cards remain.

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
      this.game.phase === GamePhase.WAITING_FOR_PLAYERS ||
      this.game.phase === GamePhase.WAITING_FOR_READY
        ? { phase: "pre-game", readyPlayers: this.game.readyPlayers }
        : {
            phase: "game",
            hands: this.game.hands.map(hand => this.getPlayerHandView(hand, user)),
          };

    return {
      players: this.game.players,
      game,
    };
  }

  private async inPhase(phase: GamePhase | GamePhase[], act: () => void) {
    if (Array.isArray(phase) ? !phase.includes(this.game.phase) : this.game.phase !== phase) {
      throw new Error(`Expected phase ${phase} but was ${this.game.phase}`);
    }
    act();
    const transition = this.transitions.find(t => t.from === this.game.phase && t.predicate());
    if (transition) {
      this.game.setPhase(transition.to);
      if (transition.onTransition) {
        await Promise.resolve(transition.onTransition() || {});
      }
    }
    this.subscriptions.forEach(sub => sub.cb(this.getViewForUser(sub.user)));
  }

  private getPlayerHandView(hand: HandModel, player: string): HandView {
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
    })(this.game.phase);

    return {
      phase: handPhase,
      readyPlayers: hand.readyPlayers,
      hands: {
        [player]: hand.hands[player],
      },
      tricks: handIsFinished(hand.tricks) ? hand.tricks : hand.tricks.slice(-2),
      charges: hand.chargedCards,
      score: handIsFinished(hand.tricks)
        ? scoreHand(hand.tricks, combine(hand.chargedCards), this.game.players)
        : {},
    };
  }
}
