import * as pathToRegexp from "path-to-regexp";

export function getGameIdFromPathname(pathname: string) {
  const parsedUrl = pathToRegexp("/game/:gameId").exec(pathname);
  if (parsedUrl && parsedUrl.length > 0) {
    return parsedUrl[1];
  }
  return undefined;
}
