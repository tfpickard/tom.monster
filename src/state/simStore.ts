import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

import { DEFAULT_HEX_RULE, DEFAULT_SQUARE_RULE } from "@/lib/ca/rules";
import type { LatticeType, SimulationFrame } from "@/lib/ca/types";
import type { GAConfig } from "@/lib/ga/types";
import type { MappingId } from "@/lib/music/mapping";
import type { TuningId } from "@/lib/music/tunings";

interface AudioState {
  tuning: TuningId;
  customScale: string;
  mapping: MappingId;
  maxNotes: number;
  tempo: number;
}

interface UIState {
  lattice: LatticeType;
  width: number;
  height: number;
  rule: string;
  toroidal: boolean;
  playing: boolean;
  speed: number;
  density: number;
  maxPeriod: number;
  lastFrame?: SimulationFrame;
  remoteFrame?: SimulationFrame;
  audio: AudioState;
  ga: GAConfig & { iterations: number; seedWindow: number };
}

interface UIActions {
  setLattice: (lattice: LatticeType) => void;
  setRule: (rule: string) => void;
  setPlaying: (playing: boolean) => void;
  setSpeed: (speed: number) => void;
  setFrame: (frame: SimulationFrame) => void;
  setDensity: (density: number) => void;
  setRemoteFrame: (frame: SimulationFrame) => void;
  setToroidal: (value: boolean) => void;
  setAudio: (value: Partial<AudioState>) => void;
  setGA: (value: Partial<UIState["ga"]>) => void;
}

export const useSimStore = create<UIState & UIActions>()(
  immer((set) => ({
    lattice: "square",
    width: 100,
    height: 100,
    rule: DEFAULT_SQUARE_RULE,
    toroidal: false,
    playing: false,
    speed: 20,
    density: 0.25,
    maxPeriod: 20,
    remoteFrame: undefined,
    audio: {
      tuning: "12-TET",
      customScale: "440\n660\n880",
      mapping: "x-pitch",
      maxNotes: 24,
      tempo: 120,
    },
    ga: {
      populationSize: 32,
      mutationRate: 0.2,
      eliteCount: 4,
      maxGenerations: 5000,
      gridSize: 100,
      lattice: "square",
      rule: DEFAULT_SQUARE_RULE,
      toroidal: false,
      borderPenalty: 50,
      iterations: 40,
      seedWindow: 30,
    },
    setLattice: (lattice) =>
      set((state) => {
        state.lattice = lattice;
        state.rule = lattice === "square" ? DEFAULT_SQUARE_RULE : DEFAULT_HEX_RULE;
        state.width = lattice === "square" ? 100 : 90;
        state.height = lattice === "square" ? 100 : 90;
        state.ga.lattice = lattice;
        state.ga.rule = state.rule;
        state.ga.gridSize = state.width;
      }),
    setRule: (rule) =>
      set((state) => {
        state.rule = rule;
        state.ga.rule = rule;
      }),
    setPlaying: (playing) =>
      set((state) => {
        state.playing = playing;
      }),
    setSpeed: (speed) =>
      set((state) => {
        state.speed = speed;
      }),
    setFrame: (frame) =>
      set((state) => {
        state.lastFrame = frame;
      }),
    setDensity: (density) =>
      set((state) => {
        state.density = density;
      }),
    setRemoteFrame: (frame) =>
      set((state) => {
        state.remoteFrame = frame;
      }),
    setToroidal: (value) =>
      set((state) => {
        state.toroidal = value;
        state.ga.toroidal = value;
      }),
    setAudio: (value) =>
      set((state) => {
        state.audio = { ...state.audio, ...value };
      }),
    setGA: (value) =>
      set((state) => {
        state.ga = { ...state.ga, ...value };
      }),
  })),
);
