export function assertNever(message: string, never: never) {
  throw new Error(message + JSON.stringify(never));
}
