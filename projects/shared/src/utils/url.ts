import * as pathToRegexp from "path-to-regexp";

const GAME_URL_TEMPLATE = "/game/:gameId";

export function getGameIdFromPathname(pathname: string): number | undefined {
  const parsedUrl = pathToRegexp(GAME_URL_TEMPLATE).exec(pathname);
  if (parsedUrl && parsedUrl.length > 0) {
    return +parsedUrl[1];
  }
  return undefined;
}

export function getUrlForGameId(gameId: number) {
  return pathToRegexp.compile(GAME_URL_TEMPLATE)({ gameId });
}
