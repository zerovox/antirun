import { Card, PlayerMap, Trick } from "@antirun/shared";
import { Model } from "objection";
import { join } from "path";

export class HandModel extends Model {
  public static tableName = "Hand";

  static get jsonSchema() {
    return {
      type: "object",
      properties: {
        hands: {
          type: "object",
        },
        passes: {
          type: "object",
        },
        chargedCards: {
          type: "object",
        },
        readyPlayers: {
          type: "object",
        },
        tricks: {
          type: "array",
          items: { type: "object" },
        },
      },
    };
  }

  public static relationMappings = {
    passLeftHand: {
      relation: Model.BelongsToOneRelation,
      modelClass: join(__dirname, "Game"),
      join: {
        from: "Game.id",
        to: "Hand.parentId",
      },
    },
  };

  public readonly id: number;
  public readonly parentId: number;
  public readonly hands: PlayerMap<Card[]>;
  public readonly passes: PlayerMap<[Card, Card, Card] | undefined>;
  public readonly chargedCards: PlayerMap<Card[]>;
  public readonly readyPlayers: PlayerMap<boolean>;
  public readonly tricks: Trick[];

  public setTricks(tricks: Trick[]) {
    this.tricks! = tricks;
    this.patch({ tricks });
  }

  public setHands(hands: PlayerMap<Card[]>) {
    this.hands! = hands;
    this.patch({ hands });
  }

  public setChargedCards(chargedCards: PlayerMap<Card[]>) {
    this.chargedCards! = chargedCards;
    this.patch({ chargedCards });
  }

  public setReadyPlayers(readyPlayers: PlayerMap<boolean>) {
    this.readyPlayers! = readyPlayers;
    this.patch({ readyPlayers });
  }

  private async patch(patch: Partial<HandModel>) {
    const model = await HandModel.query()
      .patchAndFetchById(this.id, patch)
      .throwIfNotFound();
    if (model === undefined) {
      throw new Error("Model not returned after update");
    }
  }
}
