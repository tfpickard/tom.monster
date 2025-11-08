"use client";

import { useEffect } from "react";

import type { Genome } from "@/lib/ga/types";
import { useGaWorker } from "@/hooks/useGaWorker";
import { useSimStore } from "@/state/simStore";

interface Props {
  onLoadGenome: (genome: Genome) => void;
}

export function GAPanel({ onLoadGenome }: Props) {
  const { ga, setGA } = useSimStore();
  const { run, cancel, running, progress, result } = useGaWorker(ga);

  useEffect(() => {
    if (result) {
      onLoadGenome(result.genome);
    }
  }, [onLoadGenome, result]);

  return (
    <div className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/40 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Genetic Algorithm</h3>
        <div className="space-x-2">
          <button
            className="rounded bg-primary px-3 py-1 text-slate-900"
            onClick={running ? cancel : run}
          >
            {running ? "Stop" : "Run"}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <label>
          <span className="text-slate-400">Population</span>
          <input
            type="number"
            className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1"
            value={ga.populationSize}
            onChange={(e) => setGA({ populationSize: Number(e.target.value) })}
          />
        </label>
        <label>
          <span className="text-slate-400">Mutation</span>
          <input
            type="number"
            step={0.05}
            className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1"
            value={ga.mutationRate}
            onChange={(e) => setGA({ mutationRate: Number(e.target.value) })}
          />
        </label>
        <label>
          <span className="text-slate-400">Iterations</span>
          <input
            type="number"
            className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1"
            value={ga.iterations}
            onChange={(e) => setGA({ iterations: Number(e.target.value) })}
          />
        </label>
        <label>
          <span className="text-slate-400">Seed window</span>
          <input
            type="number"
            className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1"
            value={ga.seedWindow}
            onChange={(e) => setGA({ seedWindow: Number(e.target.value) })}
          />
        </label>
        <label>
          <span className="text-slate-400">Sim cap</span>
          <input
            type="number"
            className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1"
            value={ga.maxGenerations}
            onChange={(e) => setGA({ maxGenerations: Number(e.target.value) })}
          />
        </label>
        <label>
          <span className="text-slate-400">Border penalty</span>
          <input
            type="number"
            className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1"
            value={ga.borderPenalty}
            onChange={(e) => setGA({ borderPenalty: Number(e.target.value) })}
          />
        </label>
      </div>
      <div className="rounded border border-slate-800 bg-slate-950/40 p-2 text-xs text-slate-400">
        <p>
          Best fitness: <strong>{progress?.bestFitness ?? result?.fitness ?? 0}</strong>
        </p>
        <p>Generation: {progress?.generation ?? 0}</p>
      </div>
    </div>
  );
}
