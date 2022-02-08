export class Random {
  public seed: number|undefined;

  constructor(seed) {
    this.seed = seed;
  }

  next(): number {
    return ((2 ** 31 - 1) & (this.seed = Math.imul(48271, this.seed))) / 2 ** 31;
  }
}


let randomizer: Random;


export function getSeed() {
  return randomizer.seed;
}

const seedStack = [];
export function pushSeed(seed: number) {
  seedStack.push(getSeed());
  randomizer.seed = seed;
}
export function popSeed() {
  randomizer.seed = seedStack[seedStack.length-1];
  seedStack.splice(seedStack.length-1, 1)
}


export function initRandomizer(seed: number) {
  randomizer = new Random(seed);
}

export function rand() {
  return randomizer.next();
}

export function mapRandom(value, start, end) {
  return start + value * (end - start);
}

export function random(start, end) {
  return mapRandom(rand(), start, end);
}

export function randint(start, end) {
  return Math.floor(random(start, end + 1))
}

export function percpick(opts: any[]) {
  const r = rand();
  const sum = opts.filter((v, idx) => idx%2 == 0).reduce((sum, v) => sum + v, 0);
  let prev = 0;
  for (let i = 0; i < opts.length; i = i + 2) {
    const thisPart = (opts[i] / sum);

    // For debugging:
    // const thisPart = opts[i] == 0 ? 0 : 1/(opts.length/2);

    const t = thisPart + prev;
    if (r < t) {
      return opts[i + 1];
    }
    prev += thisPart;
  }
}

export function randomSeed() {
  return  Math.random() * 9999999999;
}