import { nanoid } from "nanoid";

import { safeParseRule } from "../ca/rules";
import { SimulationConfig, SimulationFrame, SimulationState } from "../ca/types";
import { createSimulationState, stepSimulation } from "../ca/simulator";
import type { GAConfig, GARunProgress, Genome } from "./types";

interface RunOptions {
  iterations: number;
  seedWindow: number;
  onProgress?: (progress: GARunProgress) => void;
  shouldCancel?: () => boolean;
}

const DEFAULT_ITERATIONS = 60;

export function randomGenome(window: number): Genome {
  const cells: Array<[number, number]> = [];
  const targetCount = Math.max(8, Math.floor(window * window * 0.1));
  const used = new Set<string>();
  while (cells.length < targetCount) {
    const x = Math.floor(Math.random() * window);
    const y = Math.floor(Math.random() * window);
    const key = `${x}:${y}`;
    if (used.has(key)) continue;
    used.add(key);
    cells.push([x, y]);
  }
  return { id: nanoid(), cells };
}

function mutateGenome(genome: Genome, window: number, rate: number): Genome {
  const next: Array<[number, number]> = genome.cells.map(([x, y]) => [x, y]);
  for (let i = 0; i < next.length; i++) {
    if (Math.random() < rate) {
      next[i] = [
        Math.max(0, Math.min(window - 1, next[i][0] + (Math.random() < 0.5 ? -1 : 1))),
        Math.max(0, Math.min(window - 1, next[i][1] + (Math.random() < 0.5 ? -1 : 1))),
      ];
    }
  }
  if (Math.random() < rate) {
    next.push([Math.floor(Math.random() * window), Math.floor(Math.random() * window)]);
  }
  if (Math.random() < rate && next.length > 1) {
    next.splice(Math.floor(Math.random() * next.length), 1);
  }
  return { id: nanoid(), cells: next };
}

function crossover(a: Genome, b: Genome): Genome {
  const child: Array<[number, number]> = [];
  const max = Math.max(a.cells.length, b.cells.length);
  for (let i = 0; i < max; i++) {
    const gene = i % 2 === 0 ? a.cells[i % a.cells.length] : b.cells[i % b.cells.length];
    if (gene) {
      child.push([...gene] as [number, number]);
    }
  }
  return { id: nanoid(), cells: child };
}

function embedGenome(genome: Genome, grid: number, window: number, buffer: Uint8Array) {
  buffer.fill(0);
  const offset = Math.floor((grid - window) / 2);
  for (const [x, y] of genome.cells) {
    const gx = offset + x;
    const gy = offset + y;
    if (gx >= 0 && gx < grid && gy >= 0 && gy < grid) {
      buffer[gy * grid + gx] = 1;
    }
  }
}

function touchesBorder(frame: SimulationFrame, size: number) {
  const { cells } = frame;
  const limit = size - 1;
  for (let i = 0; i < cells.length; i++) {
    if (!cells[i]) continue;
    const x = i % size;
    const y = Math.floor(i / size);
    if (x === 0 || y === 0 || x === limit || y === limit) {
      return true;
    }
  }
  return false;
}

function evaluateGenome(genome: Genome, config: GAConfig, seedWindow: number): number {
  const rule = safeParseRule(config.rule);
  const simConfig: SimulationConfig = {
    lattice: config.lattice,
    width: config.gridSize,
    height: config.gridSize,
    rule,
    toroidal: config.toroidal,
    maxPeriod: 50,
  };

  let buffer: Uint8Array | null = null;
  const state = createSimulationState(simConfig, (cells) => {
    buffer = cells;
  });
  if (!buffer) {
    buffer = new Uint8Array(simConfig.width * simConfig.height);
  }
  embedGenome(genome, simConfig.width, seedWindow, buffer);

  let best = 0;
  let borderAt: number | null = null;
  for (let i = 0; i < config.maxGenerations; i++) {
    const frame = stepSimulation(state);
    best = frame.generation;
    if (!config.toroidal && !borderAt && touchesBorder(frame, simConfig.width)) {
      borderAt = frame.generation;
    }
    if (frame.terminated) {
      break;
    }
  }
  if (!config.toroidal && borderAt) {
    const penalty = Math.max(0, config.borderPenalty - borderAt / 20);
    best = Math.max(0, best - penalty);
  }
  return Math.max(0, best);
}

export function runGeneticSearch(config: GAConfig, options: Partial<RunOptions> = {}) {
  const iterations = options.iterations ?? DEFAULT_ITERATIONS;
  const seedWindow = options.seedWindow ?? 30;
  const onProgress = options.onProgress;
  const shouldCancel = options.shouldCancel ?? (() => false);
  const population: Genome[] = Array.from({ length: config.populationSize }, () =>
    randomGenome(seedWindow),
  );

  let bestGenome = population[0];
  let bestFitness = 0;

  for (let generation = 0; generation < iterations; generation++) {
    if (shouldCancel()) break;
    const scored = population.map((genome) => ({
      genome,
      fitness: evaluateGenome(genome, config, seedWindow),
    }));
    scored.sort((a, b) => b.fitness - a.fitness);
    if (scored[0].fitness > bestFitness) {
      bestFitness = scored[0].fitness;
      bestGenome = scored[0].genome;
    }

    onProgress?.({
      generation,
      bestFitness,
      population: config.populationSize,
      bestGenome,
    });

    const elites = scored.slice(0, config.eliteCount).map(({ genome }) => genome);
    const next: Genome[] = [...elites];
    while (next.length < config.populationSize) {
      const parentA =
        elites[Math.floor(Math.random() * elites.length)] ?? randomGenome(seedWindow);
      const parentB =
        elites[Math.floor(Math.random() * elites.length)] ?? randomGenome(seedWindow);
      let child = crossover(parentA, parentB);
      child = mutateGenome(child, seedWindow, config.mutationRate);
      next.push(child);
    }
    population.splice(0, population.length, ...next);
  }

  return { bestGenome, bestFitness };
}
