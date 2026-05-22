const MODULUS = 2147483647;
const MULTIPLIER = 48271;

export const nextRandom = (seed) => {
  const safeSeed = seed <= 0 ? 1 : seed;
  const nextSeed = (safeSeed * MULTIPLIER) % MODULUS;
  const value = nextSeed / MODULUS;

  return { value, nextSeed };
};
