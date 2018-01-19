import { GameList, getGameIdFromPathname, getUrlForGameId } from "@antirun/shared";
import * as Cookies from "js-cookie";
import * as qs from "qs";
import * as React from "react";
import { GamePage } from "./pages/GamePage";
import { JoinGamePage } from "./pages/JoinGamePage";
import { SetUserPage } from "./pages/SetUserPage";

export interface AppState {
  user: string | undefined;
  gameId: number | undefined;
  activeGames: GameList | undefined;
}

export class App extends React.Component<{}, AppState> {
  public state: AppState = {
    user: Cookies.get("user"),
    gameId: getGameIdFromPathname(window.location.pathname),
    activeGames: undefined,
  };

  public async componentWillMount() {
    // TODO : set up URL listener.
    if (!this.state.gameId) {
      const fetchResponse = await fetch(window.location.origin + "/api/games");
      const activeGames: GameList = await fetchResponse.json();
      this.setState({ activeGames });
    }
  }

  public render() {
    // TODO : list current + past games
    const query = qs.parse(window.location.search.slice(1));
    const user = query.user || this.state.user;

    if (!user) {
      return <SetUserPage setUser={this.handleSetUser} />;
    }

    if (this.state.gameId === undefined) {
      if (this.state.activeGames !== undefined) {
        return <JoinGamePage activeGames={this.state.activeGames} />;
      }
      return <div className="">Loading games</div>;
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
