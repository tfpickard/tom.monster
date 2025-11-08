import type { LatticeType } from "../ca/types";

export type MappingId = "x-pitch" | "y-pitch" | "centroid";

export interface NoteEvent {
  frequency: number;
  voice: "percussive" | "plucked" | "pad";
  velocity: number;
}

export interface MappingOptions {
  lattice: LatticeType;
  width: number;
  height: number;
  tuning: number[];
  maxNotes: number;
  strategy: MappingId;
}

function pickVoice(voiceIndex: number): NoteEvent["voice"] {
  if (voiceIndex % 3 === 0) return "percussive";
  if (voiceIndex % 3 === 1) return "plucked";
  return "pad";
}

export function mapCellsToNotes(cells: Uint8Array, options: MappingOptions) {
  const { width, height, tuning, maxNotes, strategy } = options;
  const active: { idx: number; x: number; y: number }[] = [];
  for (let i = 0; i < cells.length; i++) {
    if (cells[i]) {
      active.push({
        idx: i,
        x: i % width,
        y: Math.floor(i / width),
      });
    }
  }
  active.sort((a, b) => a.idx - b.idx);

  const notes: NoteEvent[] = [];
  if (!active.length) return notes;

  const quantize = (value: number) =>
    tuning[(Math.abs(value) + tuning.length) % tuning.length];

  const limit = Math.min(maxNotes, active.length);
  const stride = Math.max(1, Math.floor(active.length / limit));

  for (let i = 0; i < active.length && notes.length < limit; i += stride) {
    const cell = active[i];
    let index: number;
    switch (strategy) {
      case "y-pitch":
        index = cell.y;
        break;
      case "centroid":
        index = Math.round((cell.x + cell.y) / 2);
        break;
      default:
        index = cell.x;
    }
    notes.push({
      frequency: quantize(index),
      voice: pickVoice(notes.length),
      velocity: 0.5 + (cell.y / height) * 0.5,
    });
  }

  return notes;
}
