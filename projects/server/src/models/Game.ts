import { ALL_CARDS, makeObject, PlayerMap, segment, shuffle } from "@antirun/shared";
import { Model } from "objection";
import { join } from "path";
import { GamePhase } from "../TurboHeartsGameEngine";
import { HandModel } from "./Hand";

export class GameModel extends Model {
  public static tableName = "Game";

  static get jsonSchema() {
    return {
      type: "object",
      properties: {
        readyPlayers: {
          type: "object",
        },
        players: {
          type: "array",
          items: { type: "string" },
        },
      },
    };
  }

  public static relationMappings = {
    hands: {
      relation: Model.HasManyRelation,
      modelClass: join(__dirname, "Hand"),
      join: {
        from: "Game.id",
        to: "Hand.parentId",
      },
    },
  };

  public readonly id: number;
  public readonly phase: GamePhase;
  public readonly players: string[];
  public readonly readyPlayers: PlayerMap<boolean>;
  public readonly hands: HandModel[];

  public setPhase(phase: GamePhase) {
    this.phase! = phase;
    this.patch({ phase });
  }

  public setPlayers(players: string[]) {
    this.players! = players;
    this.patch({ players });
  }

  public setReadyPlayers(readyPlayers: PlayerMap<boolean>) {
    this.readyPlayers! = readyPlayers;
    this.patch({ readyPlayers });
  }

  public async createNewHand(): Promise<HandModel> {
    const allHands = segment(shuffle(ALL_CARDS), 13);

    const hand = await HandModel.query().insertAndFetch({
      parentId: this.id,
      hands: makeObject(this.players, (_playerName, index) => allHands[index]),
      chargedCards: makeObject(this.players, () => []),
      tricks: [],
      passes: makeObject(this.players, () => undefined),
      readyPlayers: makeObject(this.players, () => false),
    });

    this.hands.push(hand);

    return hand;
  }

  private async patch(patch: Partial<GameModel>) {
    const model = await GameModel.query()
      .patchAndFetchById(this.id, patch)
      .throwIfNotFound();
    if (model === undefined) {
      throw new Error("Model not returned after update");
    }
  }
}

export const EMPTY_GAME = {
  phase: GamePhase.WAITING_FOR_PLAYERS,
  players: [],
  readyPlayers: {},
  hands: [],
};
