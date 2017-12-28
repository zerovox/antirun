export function makeObject<V>(
  keys: string[],
  keyMapper: (key: string, index: number) => V,
): { [key: string]: V } {
  const obj: { [key: string]: V } = {};
  keys.forEach((key, index) => (obj[key] = keyMapper(key, index)));
  return obj;
}
