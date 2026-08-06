export function nextRng(seed: number): { value: number; seed: number } {
  const seed2 = (Math.imul(1664525, seed) + 1013904223) >>> 0;
  return { value: seed2 / 0xffffffff, seed: seed2 };
}
