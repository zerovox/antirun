import { assertNever, ChatEntry, GameState, HandState, ServerEvent } from "@tsm/shared";
import * as React from "react";

import { ClientEvent } from "../../../shared/src/events";
import { Chat } from "./components/Chat";
import { Hand } from "./components/Hand";
import { HandHeadingRow } from "./components/HandHeadingRow";
import { PlayersRow } from "./components/PlayersRow";
import { PreGame } from "./components/PreGame";
import { Tricks } from "./components/Tricks";

export interface GamePageProps {
  gameId: string;
  player: string;
}

export interface GamePageState {
  gameState: GameState | undefined;
  chatEntries: ChatEntry[];
}

export class GamePage extends React.Component<GamePageProps, GamePageState> {
  public state: GamePageState = {
    gameState: undefined,
    chatEntries: [],
  };

  private ws: WebSocket | undefined = undefined;

  public componentWillMount() {
    this.initializeGame(this.props.gameId);
  }

  public render() {
    const { gameState, chatEntries } = this.state;

    return (
      <div className="turbo">
        {gameState && this.renderGame(gameState)}
        <Chat chatEntries={chatEntries} />
      </div>
    );
  }

  private renderGame(gameState: GameState) {
    if (gameState.game.phase === "pre-game") {
      return (
        <PreGame
          player={this.props.player}
          players={gameState.players}
          readyPlayers={gameState.game.readyPlayers}
          ready={this.handleReady}
          unready={this.handleUnready}
          join={this.handleJoin}
          leave={this.handleLeave}
        />
      );
    }

    return gameState.game.hands.map((hand, index) => (
      <GameHand hand={hand} players={gameState.players} handNumber={index} />
    ));
  }

  private initializeGame(gameId: string) {
    if (this.ws) {
      this.ws.close(1000, "this is a game changer");
    }

    this.ws = new WebSocket("ws://localhost:8999/game/" + gameId);

    this.ws.addEventListener("message", rawEvent => {
      const event: ServerEvent = JSON.parse(rawEvent.data);
      if (event.name === "state") {
        this.setState({ gameState: event.state });
      } else if (event.name === "chat-history") {
        this.setState({ chatEntries: event.messages });
      } else if (event.name === "chat") {
        this.setState({
          chatEntries: this.state.chatEntries.concat([event.message]),
        });
      } else if (event.name === "ack") {
        // TODO : handle acks.
      } else {
        assertNever("Unexpected event: ", event);
      }
    });

    this.ws.addEventListener("open", () => {
      this.sendEvent({ name: "init", user: this.props.player });
    });
  }

  private handleReady = () => {
    this.sendEvent({
      name: "ready",
      nonce: createNonce(),
    });
  };

  private handleUnready = () => {
    this.sendEvent({
      name: "unready",
      nonce: createNonce(),
    });
  };

  private handleJoin = () => {
    this.sendEvent({
      name: "join",
      nonce: createNonce(),
    });
  };

  private handleLeave = () => {
    this.sendEvent({
      name: "leave",
      nonce: createNonce(),
    });
  };

  private sendEvent(gameEvent: ClientEvent) {
    if (this.ws) {
      this.ws.send(JSON.stringify(gameEvent));
      // TODO: nonce.
    }
  }
}

interface GameHandProps {
  players: string[];
  hand: HandState;
  handNumber: number;
}

function GameHand({ players, handNumber, hand }: GameHandProps) {
  return (
    <div className="game">
      <table className="trick-table">
        <thead>
          <HandHeadingRow handNumber={handNumber} />
          <PlayersRow players={players} />
        </thead>
        <Tricks players={players} tricks={hand.tricks} />
      </table>

      {Object.keys(hand.hands).map(player => <Hand key={player} hand={hand.hands[player]} />)}
    </div>
  );
}

function createNonce() {
  return Math.random().toString(16);
}
