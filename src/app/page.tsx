"use client";

import { useCallback, useEffect, useMemo } from "react";

import { SimulationCanvas } from "@/components/canvas/SimulationCanvas";
import { GAPanel } from "@/components/panels/GAPanel";
import { LibraryPanel } from "@/components/panels/LibraryPanel";
import { MusicPanel } from "@/components/panels/MusicPanel";
import { SimulationControls } from "@/components/panels/SimulationControls";
import { useAudioEngine } from "@/hooks/useAudioEngine";
import { useRunStream } from "@/hooks/useRunStream";
import { useSimulationWorker } from "@/hooks/useSimulationWorker";
import { builtInSeeds } from "@/lib/ca/seeds";
import { safeParseRule } from "@/lib/ca/rules";
import type { SeedPattern } from "@/lib/ca/seeds";
import { useSimStore } from "@/state/simStore";

export default function Page() {
  const state = useSimStore();
  const config = useMemo(
    () => ({
      lattice: state.lattice,
      width: state.width,
      height: state.height,
      rule: safeParseRule(state.rule),
      toroidal: state.toroidal,
      maxPeriod: state.maxPeriod,
    }),
    [
      state.height,
      state.lattice,
      state.maxPeriod,
      state.rule,
      state.toroidal,
      state.width,
    ],
  );

  const {
    triggerNotes,
    isReady: audioReady,
    startRecording,
    stopRecording,
    recordingUrl,
  } = useAudioEngine({
    tuning: state.audio.tuning,
    customScale: state.audio.customScale,
    lattice: state.lattice,
    width: state.width,
    height: state.height,
    strategy: state.audio.mapping,
    tempo: state.audio.tempo,
    maxNotes: state.audio.maxNotes,
  });

  const worker = useSimulationWorker(config, (frame) => {
    state.setFrame(frame);
    triggerNotes(frame.cells);
  });

  useRunStream("sim:live");

  useEffect(() => {
    if (!state.playing && state.remoteFrame) {
      triggerNotes(state.remoteFrame.cells);
    }
  }, [state.playing, state.remoteFrame, triggerNotes]);

  useEffect(() => {
    const seed = builtInSeeds[0];
    fetch("/api/runs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rule: seed.rule,
        lattice: seed.lattice,
        width: seed.width,
        height: seed.height,
        seedCells: seed.cells,
      }),
    }).catch(() => undefined);
  }, []);

  const loadSeed = useCallback(
    (seed: SeedPattern) => {
      const grid = state.width * state.height;
      const buffer = new Uint8Array(grid);
      for (const [x, y] of seed.cells) {
        if (x < state.width && y < state.height) {
          buffer[y * state.width + x] = 1;
        }
      }
      worker.load(buffer);
    },
    [state.height, state.width, worker],
  );

  const loadGenome = useCallback(
    (genome: { cells: Array<[number, number]> }) => {
      const buffer = new Uint8Array(state.width * state.height);
      const offset = Math.floor((state.width - state.ga.seedWindow) / 2);
      for (const [x, y] of genome.cells) {
        const gx = offset + x;
        const gy = offset + y;
        if (gx >= 0 && gx < state.width && gy >= 0 && gy < state.height) {
          buffer[gy * state.width + gx] = 1;
        }
      }
      worker.load(buffer);
    },
    [state.ga.seedWindow, state.height, state.width, worker],
  );

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-4 p-4">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Cellular Automata → Music Playground</h1>
        <p className="text-sm text-slate-400">
          Conway-inspired experiments on square and hex grids, streamed to Tone.js
          instruments.
        </p>
      </header>
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-4">
          <div className="h-[480px]">
            <SimulationCanvas
              cells={
                state.lastFrame?.cells ??
                state.remoteFrame?.cells ??
                new Uint8Array(state.width * state.height)
              }
              width={state.width}
              height={state.height}
              lattice={state.lattice}
            />
          </div>
          <SimulationControls
            onStep={worker.step}
            onRun={worker.run}
            onPause={worker.pause}
            onRandomize={worker.randomize}
            onBenchmark={() => worker.benchmarkSim(2000)}
          />
        </div>
        <div className="flex flex-col gap-4">
          <MusicPanel
            onRecord={startRecording}
            onStopRecording={stopRecording}
            recordingUrl={recordingUrl}
          />
          <GAPanel onLoadGenome={loadGenome} />
          <LibraryPanel onLoadSeed={loadSeed} />
        </div>
      </div>
    </main>
  );
}
