import { countNeighborsHex, countNeighborsSquare } from "./neighbors";
import { HashTracker, createZobristTable, hashCells } from "./zobrist";
import { isBirth, isSurvival } from "./rules";
import type { SimulationConfig, SimulationFrame, SimulationStats } from "./types";

export interface SimulationState {
  config: SimulationConfig;
  cells: Uint8Array;
  scratch: Uint8Array;
  tracker: HashTracker;
  zobrist: Uint32Array;
  generation: number;
  terminated: boolean;
  termination?: SimulationStats["reason"];
  period?: number;
}

export type SeedInitializer = (cells: Uint8Array) => void;

export function createSimulationState(
  config: SimulationConfig,
  initializer?: SeedInitializer,
): SimulationState {
  const cellCount = config.width * config.height;
  const cells = new Uint8Array(cellCount);
  if (initializer) {
    initializer(cells);
  }
  const scratch = new Uint8Array(cellCount);
  return {
    config,
    cells,
    scratch,
    tracker: new HashTracker(config.maxPeriod),
    zobrist: createZobristTable(cellCount),
    generation: 0,
    terminated: false,
  };
}

export function toggleCell(state: SimulationState, x: number, y: number) {
  const index = y * state.config.width + x;
  state.cells[index] = state.cells[index] ? 0 : 1;
}

export function randomize(state: SimulationState, density = 0.2) {
  const buffer = state.cells;
  for (let i = 0; i < buffer.length; i++) {
    buffer[i] = Math.random() < density ? 1 : 0;
  }
  state.scratch.fill(0);
  state.generation = 0;
  state.terminated = false;
  state.tracker = new HashTracker(state.config.maxPeriod);
}

export function applySeed(state: SimulationState, seed: Uint8Array) {
  state.cells.fill(0);
  state.cells.set(seed.subarray(0, state.cells.length));
  state.generation = 0;
  state.terminated = false;
  state.tracker = new HashTracker(state.config.maxPeriod);
}

function nextPopulation(state: SimulationState): SimulationStats {
  const {
    config: { lattice, width, height, rule, toroidal },
    cells,
    scratch,
    tracker,
    zobrist,
  } = state;
  const source = cells;
  const target = scratch;

  let population = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const alive = source[idx] === 1;
      const neighbors =
        lattice === "square"
          ? countNeighborsSquare(source, width, height, x, y, toroidal)
          : countNeighborsHex(source, width, height, x, y, toroidal);
      const nextAlive = alive ? isSurvival(rule, neighbors) : isBirth(rule, neighbors);
      target[idx] = nextAlive ? 1 : 0;
      if (nextAlive) {
        population += 1;
      }
    }
  }

  const hash = hashCells(target, zobrist);
  const stats: SimulationStats = {
    generation: state.generation + 1,
    population,
    hash,
    terminated: false,
  };

  if (population === 0) {
    stats.terminated = true;
    stats.reason = "extinction";
  } else if (tracker.has(hash)) {
    const period = tracker.period(hash, stats.generation);
    stats.terminated = true;
    stats.reason = period && period <= state.config.maxPeriod ? "periodic" : "steady";
    stats.period = period ?? undefined;
  }

  tracker.add(hash, stats.generation);

  state.cells = target;
  state.scratch = source;
  state.generation = stats.generation;

  if (stats.terminated) {
    state.terminated = true;
    state.termination = stats.reason;
    state.period = stats.period;
  }

  return stats;
}

export function stepSimulation(state: SimulationState): SimulationFrame {
  const stats = nextPopulation(state);
  return {
    ...stats,
    cells: state.cells.slice(),
  };
}
