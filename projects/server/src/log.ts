export function gameLog(gameId: string, message: string) {
  info(`#${gameId}: ${message}`);
}

export function gameWarn(gameId: string, message: string) {
  warn(`#${gameId}: ${message}`);
}

export function gameError(gameId: string, message: string) {
  error(`#${gameId}: ${message}`);
}

export function info(message: string) {
  // tslint:disable-next-line:no-console
  console.info(`[INFO] ${message}`);
}

export function warn(message: string) {
  // tslint:disable-next-line:no-console
  console.warn(`[WARN] ${message}`);
}

export function error(message: string) {
  // tslint:disable-next-line:no-console
  console.error(`[ERROR] ${message}`);
}
