function mulberry32(seed: number) {
  return function next() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createZobristTable(size: number, seed = 1337) {
  const rng = mulberry32(seed);
  const table = new Uint32Array(size);
  for (let i = 0; i < size; i++) {
    table[i] = Math.floor(rng() * 0xffffffff);
  }
  return table;
}

export function hashCells(cells: Uint8Array, table: Uint32Array) {
  let hash = 0;
  for (let i = 0; i < cells.length; i++) {
    if (cells[i]) {
      hash ^= table[i];
    }
  }
  return hash >>> 0;
}

export class HashTracker {
  #seen = new Map<number, number>();
  #limit: number;

  constructor(limit = 20) {
    this.#limit = limit;
  }

  add(hash: number, generation: number) {
    this.#seen.set(hash, generation);
    if (this.#seen.size > this.#limit * 2) {
      const keys = [...this.#seen.keys()].sort((a, b) => a - b);
      for (const key of keys.slice(0, this.#seen.size - this.#limit * 2)) {
        this.#seen.delete(key);
      }
    }
  }

  has(hash: number) {
    return this.#seen.has(hash);
  }

  period(hash: number, generation: number) {
    const previous = this.#seen.get(hash);
    if (previous === undefined) {
      return null;
    }
    return generation - previous;
  }
}
