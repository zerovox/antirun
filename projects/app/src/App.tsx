import { getGameIdFromPathname } from "@tsm/shared";
import * as Cookies from "js-cookie";
import * as React from "react";
import { GamePage } from "./pages/GamePage";
import { JoinGamePage } from "./pages/JoinGamePage";
import { SetUserPage } from "./pages/SetUserPage";

export class AppState {
  public user: string | undefined;
  public gameId: string | undefined;
}

export class App extends React.Component<{}, AppState> {
  public state = {
    user: Cookies.get("user"),
    gameId: getGameIdFromPathname(window.location.pathname),
  };

  public componentWillMount() {
    // TODO : set up URL listener.
  }

  public render() {
    if (!this.state.user) {
      return <SetUserPage setUser={this.handleSetUser} />;
    }

    if (!this.state.gameId) {
      return <JoinGamePage />;
    }

    return <GamePage gameId={this.state.gameId} player={this.state.user} />;
  }

  private handleSetUser = (user: string) => {
    Cookies.set("user", user, { expires: 365 });
    this.setState({ user });
  };
}
