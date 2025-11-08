"use client";

import { useCallback } from "react";

import { DEFAULT_HEX_RULE, DEFAULT_SQUARE_RULE, parseRule } from "@/lib/ca/rules";
import { useSimStore } from "@/state/simStore";

interface Props {
  onStep: () => void;
  onRun: (speed: number) => void;
  onPause: () => void;
  onRandomize: (density: number) => void;
  onBenchmark: () => void;
}

export function SimulationControls({
  onStep,
  onRun,
  onPause,
  onRandomize,
  onBenchmark,
}: Props) {
  const {
    lattice,
    rule,
    playing,
    speed,
    toroidal,
    density,
    lastFrame,
    setRule,
    setLattice,
    setPlaying,
    setSpeed,
    setToroidal,
    setDensity,
  } = useSimStore();

  const handleToggle = useCallback(() => {
    if (playing) {
      setPlaying(false);
      onPause();
    } else {
      setPlaying(true);
      onRun(speed);
    }
  }, [onPause, onRun, playing, setPlaying, speed]);

  const handleRuleChange = useCallback(
    (value: string) => {
      try {
        parseRule(value);
        setRule(value);
      } catch {
        // ignore invalid strings until blur
      }
    },
    [setRule],
  );

  const handleLattice = useCallback(
    (next: "square" | "hex") => {
      setLattice(next);
      setRule(next === "square" ? DEFAULT_SQUARE_RULE : DEFAULT_HEX_RULE);
    },
    [setLattice, setRule],
  );

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4 space-y-4">
      <div className="flex items-center gap-2">
        <button
          className="rounded bg-primary px-3 py-1 font-semibold text-slate-900"
          onClick={handleToggle}
        >
          {playing ? "Pause" : "Play"}
        </button>
        <button className="rounded border border-slate-700 px-3 py-1" onClick={onStep}>
          Step
        </button>
        <button
          className="rounded border border-slate-700 px-3 py-1"
          onClick={() => onRandomize(density)}
        >
          Random
        </button>
        <button
          className="rounded border border-slate-700 px-3 py-1"
          onClick={onBenchmark}
        >
          Benchmark
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <label className="text-sm text-slate-400">
          Rule
          <input
            className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-slate-100"
            value={rule}
            onChange={(e) => handleRuleChange(e.target.value)}
          />
        </label>
        <label className="text-sm text-slate-400">
          Speed (gen/s)
          <input
            type="range"
            min={1}
            max={120}
            value={speed}
            onChange={(e) => {
              const value = Number(e.target.value);
              setSpeed(value);
              if (playing) {
                onRun(value);
              }
            }}
          />
        </label>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <div className="space-x-2">
          <span>Lattice:</span>
          <button
            className={`rounded px-2 py-1 ${lattice === "square" ? "bg-primary text-slate-900" : "border border-slate-700"}`}
            onClick={() => handleLattice("square")}
          >
            Square
          </button>
          <button
            className={`rounded px-2 py-1 ${lattice === "hex" ? "bg-primary text-slate-900" : "border border-slate-700"}`}
            onClick={() => handleLattice("hex")}
          >
            Hex
          </button>
        </div>
        <label className="space-x-2">
          <input
            type="checkbox"
            checked={toroidal}
            onChange={(e) => setToroidal(e.target.checked)}
          />
          <span>Torus</span>
        </label>
        <label className="space-x-2">
          <input
            type="range"
            min={0.05}
            max={0.5}
            step={0.05}
            value={density}
            onChange={(e) => setDensity(Number(e.target.value))}
          />
          <span className="text-slate-400">Density</span>
        </label>
      </div>
      <div className="text-xs text-slate-400">
        <p>
          Gen: <strong>{lastFrame?.generation ?? 0}</strong> — Pop:{" "}
          <strong>{lastFrame?.population ?? 0}</strong>
        </p>
        <p>Status: {lastFrame?.terminated ? lastFrame.reason : "Running"}</p>
      </div>
    </div>
  );
}
