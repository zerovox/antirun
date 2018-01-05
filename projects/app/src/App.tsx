import { getGameIdFromPathname, getUrlForGameId } from "@tsm/shared";
import * as Cookies from "js-cookie";
import * as qs from "qs";
import * as React from "react";
import { GamePage } from "./pages/GamePage";
import { JoinGamePage } from "./pages/JoinGamePage";
import { SetUserPage } from "./pages/SetUserPage";

export class AppState {
  public user: string | undefined;
  public gameId: number | undefined;
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
    const query = qs.parse(window.location.search.slice(1));
    const user = query.user || this.state.user;

    if (!user) {
      return <SetUserPage setUser={this.handleSetUser} />;
    }

    if (!this.state.gameId) {
      return <JoinGamePage />;
    }

    if (query.test) {
      const url = getUrlForGameId(this.state.gameId);
      return (
        <div>
          <iframe className="test-frame" src={url + "?user=TS"} />
          <iframe className="test-frame" src={url + "?user=DC"} />
          <iframe className="test-frame" src={url + "?user=TW"} />
          <iframe className="test-frame" src={url + "?user=JC"} />
        </div>
      );
    }

    return <GamePage gameId={this.state.gameId} player={user} />;
  }

  private handleSetUser = (user: string) => {
    Cookies.set("user", user, { expires: 365 });
    this.setState({ user });
  };
}
