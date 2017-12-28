export function segment<T>(ts: T[], count: number): T[][] {
  const output: T[][] = [];
  const last = count;

  do {
    output.push(ts.slice(last - count, last));
  } while (last < ts.length);
  return output;
}
