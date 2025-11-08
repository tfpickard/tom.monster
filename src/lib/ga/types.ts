import type { LatticeType } from "../ca/types";

export interface Genome {
  id: string;
  cells: Array<[number, number]>;
}

export interface GAConfig {
  populationSize: number;
  mutationRate: number;
  eliteCount: number;
  maxGenerations: number;
  gridSize: number;
  lattice: LatticeType;
  rule: string;
  toroidal: boolean;
  borderPenalty: number;
}

export interface GARunProgress {
  generation: number;
  bestFitness: number;
  population: number;
  bestGenome: Genome;
}
