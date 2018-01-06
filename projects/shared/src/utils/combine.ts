export function combine<T>(obj: { [key: string]: T[] }): T[] {
  return Object.keys(obj).reduce((ts, key) => ts.concat(obj[key]), [] as T[]);
}
