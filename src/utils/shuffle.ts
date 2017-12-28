// https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
export function shuffle<T>(input: T[]): T[] {
  const output = [...input];
  let currentIndex = output.length;
  let randomIndex: number;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    const temporaryValue = output[currentIndex];
    output[currentIndex] = output[randomIndex];
    output[randomIndex] = temporaryValue;
  }

  return output;
}
