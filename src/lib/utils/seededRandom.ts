/**
 * Mulberry32 seeded PRNG — deterministic random number generator.
 * Given the same seed, always produces the same sequence.
 */
export class SeededRandom {
  private state: number;

  constructor(seed: number) {
    this.state = seed;
  }

  /** Returns a float in [0, 1) */
  next(): number {
    this.state |= 0;
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Returns an integer in [min, max] (inclusive) */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /** Returns true with the given probability [0, 1] */
  chance(probability: number): boolean {
    return this.next() < probability;
  }
}

/** Create a seeded RNG for a specific game seed + week */
export function createWeekRng(gameSeed: number, week: number): SeededRandom {
  // Combine seed and week to get a unique seed per week
  return new SeededRandom(gameSeed * 1000 + week);
}
