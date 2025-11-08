"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { builtInSeeds, SeedPattern } from "@/lib/ca/seeds";

type PresetResponse = {
  id: string;
  name: string;
  rule: string;
  latticeType: "square" | "hex";
  gridWidth: number;
  gridHeight: number;
  seedCells: Array<[number, number]>;
};

interface Props {
  onLoadSeed: (seed: SeedPattern) => void;
}

export function LibraryPanel({ onLoadSeed }: Props) {
  const [query, setQuery] = useState("");
  const { data } = useQuery<PresetResponse[]>({
    queryKey: ["presets"],
    queryFn: async () => {
      const res = await fetch("/api/presets");
      if (!res.ok) throw new Error("Failed to fetch presets");
      return res.json();
    },
  });

  const presets: SeedPattern[] = useMemo(() => {
    const remote =
      data?.map((preset) => ({
        id: preset.id,
        name: preset.name,
        description: preset.rule,
        lattice: preset.latticeType,
        width: preset.gridWidth,
        height: preset.gridHeight,
        rule: preset.rule,
        cells: preset.seedCells,
      })) ?? [];
    return [...builtInSeeds, ...remote];
  }, [data]);

  const filtered = presets.filter((preset) =>
    preset.name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/40 p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-slate-100">Library</h3>
        <input
          placeholder="Search"
          className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="grid max-h-64 gap-2 overflow-y-auto text-sm">
        {filtered.map((preset) => (
          <button
            key={`${preset.lattice}-${preset.id}`}
            className="rounded border border-slate-700 bg-slate-950/40 px-3 py-2 text-left hover:border-primary"
            onClick={() => onLoadSeed(preset)}
          >
            <div className="font-semibold text-slate-100">{preset.name}</div>
            <p className="text-xs text-slate-400">{preset.description}</p>
            <p className="text-xs text-slate-500">
              {preset.lattice} · {preset.rule}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
