export class Random {
  private seed: number|undefined;

  constructor(seed?: number) {
    this.seed = seed;
  }

  next(): number {
    if (this.seed) {
      return ((2 ** 31 - 1) & (this.seed = Math.imul(48271, this.seed))) / 2 ** 31;
    } else {
      return Math.random();
    }
  }
}

export type Randomizer = () => number;


let randomizer: Random;

export function initRandomizer(seed?: number) {
  randomizer = new Random(seed);
  return randomizer;
}

export function rand() {
  if (!randomizer) {
    initRandomizer();
  }
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
    const t = thisPart + prev;
    if (r < t) {
      return opts[i + 1];
    }
    prev += thisPart;
  }
}

export function randpick(opts: any[]) {
  // TODO: Validate sum is < 100%

  const r = rand();
  let prev = 0;
  for (let i = 0; i <= opts.length - 2; i = i + 2) {
    const t = opts[i] + prev;
    if (r < t) {
      return opts[i + 1];
    }
    prev += opts[i];
  }
  return opts[opts.length - 1];
}