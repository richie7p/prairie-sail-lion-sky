export function rngNext(state: number): { value: number; state: number } {
  let a = (state | 0) + 0x6d2b79f5;
  a |= 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return { value, state: a >>> 0 };
}

export function createRng(initial: number) {
  let state = initial >>> 0;
  return {
    next() {
      const r = rngNext(state);
      state = r.state;
      return r.value;
    },
    int(min: number, max: number) {
      return min + Math.floor(this.next() * (max - min + 1));
    },
    range(min: number, max: number) {
      return min + this.next() * (max - min);
    },
    chance(p: number) {
      return this.next() < p;
    },
    pick<T>(arr: readonly T[]): T {
      return arr[Math.floor(this.next() * arr.length)]!;
    },
    getState() {
      return state;
    },
  };
}

export type Rng = ReturnType<typeof createRng>;
