import type { SimulationConfig, SimulationFrame } from "../ca/types";
import type { GAConfig, GARunProgress, Genome } from "../ga/types";

export type SimulationWorkerMessage =
  | { type: "init"; config: SimulationConfig; seed?: Uint8Array }
  | { type: "step" }
  | { type: "run"; speed: number }
  | { type: "pause" }
  | { type: "randomize"; density: number }
  | { type: "load"; cells: Uint8Array }
  | { type: "benchmark"; duration: number };

export type SimulationWorkerResponse =
  | { type: "ready" }
  | { type: "frame"; frame: SimulationFrame }
  | { type: "benchmark"; generationsPerSecond: number };

export type GAWorkerMessage =
  | {
      type: "run";
      config: GAConfig;
      options: { iterations: number; seedWindow: number };
    }
  | { type: "cancel" };

export type GAWorkerResponse =
  | { type: "progress"; data: GARunProgress }
  | { type: "result"; genome: Genome; fitness: number };
