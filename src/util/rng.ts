/**
 * Deterministic random number generation and probability-distribution samplers.
 *
 * Every sampler draws exclusively from a single {@link Rng} uniform stream, so a
 * seeded RNG makes the entire simulation reproducible bit-for-bit.
 */

/** A uniform random source in `[0, 1)`. */
export interface Rng {
  next(): number;
}

/**
 * `mulberry32` — a fast, well-distributed 32-bit seeded PRNG.
 * Deterministic for a given seed.
 */
export function createSeededRng(seed: number): Rng {
  let a = seed >>> 0;
  // Avoid the degenerate all-zero state.
  if (a === 0) a = 0x9e3779b9;
  return {
    next(): number {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
  };
}

/** A non-deterministic RNG backed by `Math.random`. */
export function createSystemRng(): Rng {
  return { next: () => Math.random() };
}

/** Returns a seeded RNG when `seed` is a number, otherwise a system RNG. */
export function resolveRng(seed: number | null): Rng {
  return seed === null ? createSystemRng() : createSeededRng(seed);
}

const TINY = 1e-12;

/** Standard-normal sample via the Box–Muller transform. */
export function sampleNormal(rng: Rng, mean = 0, stdDev = 1): number {
  let u1 = rng.next();
  const u2 = rng.next();
  if (u1 < TINY) u1 = TINY;
  const mag = Math.sqrt(-2 * Math.log(u1));
  return mean + stdDev * mag * Math.cos(2 * Math.PI * u2);
}

/**
 * Gamma(shape, scale=1) sample via Marsaglia–Tsang, with the
 * Johnk/boost transform for `shape < 1`. `shape` must be > 0.
 */
export function sampleGamma(rng: Rng, shape: number): number {
  if (!(shape > 0)) throw new RangeError('Gamma shape must be > 0');

  if (shape < 1) {
    const u = rng.next();
    const boost = Math.pow(u < TINY ? TINY : u, 1 / shape);
    return sampleGamma(rng, shape + 1) * boost;
  }

  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);

  for (;;) {
    let x: number;
    let v: number;
    do {
      x = sampleNormal(rng);
      v = 1 + c * x;
    } while (v <= 0);

    v = v * v * v;
    const u = rng.next();
    const x2 = x * x;

    // Squeeze test, then full acceptance test.
    if (u < 1 - 0.0331 * x2 * x2) return d * v;
    const uSafe = u < TINY ? TINY : u;
    if (Math.log(uSafe) < 0.5 * x2 + d * (1 - v + Math.log(v))) return d * v;
  }
}

/**
 * Beta(alpha, beta) sample built from two Gamma draws:
 * `X = Ga / (Ga + Gb)`. Both parameters must be > 0.
 */
export function sampleBeta(rng: Rng, alpha: number, beta: number): number {
  const ga = sampleGamma(rng, alpha);
  const gb = sampleGamma(rng, beta);
  const sum = ga + gb;
  if (sum <= 0) return 0.5;
  return ga / sum;
}
