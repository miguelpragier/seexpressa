/**
 * Deterministic 32-bit PRNG (mulberry32). Given the same seed it always
 * produces the same sequence of values, which makes maze generation
 * reproducible.
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Produces a fresh, non-deterministic seed for a new maze. */
export function randomSeed(): number {
  const array = new Uint32Array(1)
  crypto.getRandomValues(array)
  return array[0]
}
