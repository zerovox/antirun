import { assertNever, Card, ChatEntry, ClientEvent, GameView, ServerEvent } from "@antirun/shared";
import * as React from "react";
import { Chat } from "./components/Chat";
import { Hand } from "./components/Hand";
import { PreGame } from "./components/PreGame";

export interface GamePageProps {
  gameId: number;
  player: string;
}

export interface GamePageState {
  gameView: GameView | undefined;
  chatEntries: ChatEntry[];
}

export class GamePage extends React.Component<GamePageProps, GamePageState> {
  public state: GamePageState = {
    gameView: undefined,
    chatEntries: [],
  };

  private ws: WebSocket | undefined = undefined;

  public componentWillMount() {
    this.initializeGame(this.props.gameId);
  }

  public render() {
    const { player } = this.props;
    const { gameView, chatEntries } = this.state;

    return (
      <div className="turbo">
        {gameView && this.renderGame(gameView)}
        <Chat player={player} chatEntries={chatEntries} onSendMessage={this.handleMessage} />
      </div>
    );
  }

  private renderGame(gameView: GameView) {
    if (gameView.game.phase === "pre-game") {
      return (
        <PreGame
          player={this.props.player}
          players={gameView.players}
          readyPlayers={gameView.game.readyPlayers}
          ready={this.handleReady}
          unready={this.handleUnready}
          join={this.handleJoin}
          leave={this.handleLeave}
        />
      );
    }

    return gameView.game.hands.map((hand, index) => (
      <Hand
        hand={hand}
        player={this.props.player}
        players={gameView.players}
        handNumber={index}
        onPass={this.handlePass}
        onPlay={this.handlePlay}
        onCharge={this.handleCharge}
        onSkipCharge={this.handleSkipCharge}
      />
    ));
  }

  private initializeGame(gameId: number) {
    if (this.ws) {
      this.ws.close(1000, "this is a game changer");
    }

    this.ws = new WebSocket(`ws://${window.location.host}/game/${gameId}`);

    this.ws.addEventListener("message", rawEvent => {
      const event: ServerEvent = JSON.parse(rawEvent.data);
      if (event.name === "state") {
        this.setState({ gameView: event.state });
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

  private handlePass = (cards: Card[]) => {
    this.sendEvent({
      name: "pass",
      cards,
      nonce: createNonce(),
    });
  };

  private handlePlay = (card: Card) => {
    this.sendEvent({
      name: "play",
      card,
      nonce: createNonce(),
    });
  };

  private handleCharge = (card: Card) => {
    this.sendEvent({
      name: "charge",
      card,
      nonce: createNonce(),
    });
  };

  private handleSkipCharge = () => {
    this.sendEvent({
      name: "skip-charge",
      nonce: createNonce(),
    });
  };

  private handleMessage = (message: string) => {
    this.sendEvent({
      name: "message",
      message,
    });
  };

  private sendEvent(gameEvent: ClientEvent) {
    if (this.ws) {
      this.ws.send(JSON.stringify(gameEvent));
      // TODO: block ui updates til nonce?.
    }
  }
}

function createNonce() {
  return Math.random().toString(16);
}
