export type LatticeType = "square" | "hex";

export interface RuleDefinition {
  survival: Set<number>;
  birth: Set<number>;
  code: string;
}

export type CellHash = number;

export interface SimulationConfig {
  lattice: LatticeType;
  width: number;
  height: number;
  rule: RuleDefinition;
  toroidal: boolean;
  maxPeriod: number;
}

export interface SimulationStats {
  generation: number;
  population: number;
  hash: CellHash;
  terminated: boolean;
  reason?: "extinction" | "steady" | "periodic";
  period?: number;
}

export interface SimulationFrame extends SimulationStats {
  cells: Uint8Array;
}
