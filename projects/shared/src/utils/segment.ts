export function segment<T>(ts: T[], count: number): T[][] {
  const output: T[][] = [];
  let last = 0;

  while (last < ts.length) {
    last += count;
    output.push(ts.slice(last - count, last));
  }

  return output;
}
