"use client";

import { tunings } from "@/lib/music/tunings";
import { useSimStore } from "@/state/simStore";

interface Props {
  onRecord: () => void;
  onStopRecording: () => void;
  recordingUrl?: string | null;
}

export function MusicPanel({ onRecord, onStopRecording, recordingUrl }: Props) {
  const { audio, setAudio } = useSimStore();

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4 space-y-3">
      <h3 className="text-lg font-semibold text-slate-100">Music</h3>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <label>
          <span className="text-slate-400">Tempo</span>
          <input
            type="number"
            className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1"
            value={audio.tempo}
            onChange={(e) => setAudio({ tempo: Number(e.target.value) })}
          />
        </label>
        <label>
          <span className="text-slate-400">Max Notes</span>
          <input
            type="number"
            className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1"
            value={audio.maxNotes}
            onChange={(e) => setAudio({ maxNotes: Number(e.target.value) })}
          />
        </label>
      </div>
      <label className="block text-sm">
        <span className="text-slate-400">Tuning</span>
        <select
          className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1"
          value={audio.tuning}
          onChange={(e) => setAudio({ tuning: e.target.value as typeof audio.tuning })}
        >
          {Object.values(tunings).map((tuning) => (
            <option key={tuning.id} value={tuning.id}>
              {tuning.name}
            </option>
          ))}
        </select>
      </label>
      {audio.tuning === "custom" && (
        <label className="block text-sm">
          <span className="text-slate-400">Custom Hz / cents (one per line)</span>
          <textarea
            className="mt-1 h-32 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 font-mono text-xs"
            value={audio.customScale}
            onChange={(e) => setAudio({ customScale: e.target.value })}
          />
        </label>
      )}
      <label className="block text-sm">
        <span className="text-slate-400">Mapping</span>
        <select
          className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1"
          value={audio.mapping}
          onChange={(e) => setAudio({ mapping: e.target.value as typeof audio.mapping })}
        >
          <option value="x-pitch">X → Pitch</option>
          <option value="y-pitch">Y → Pitch</option>
          <option value="centroid">Centroid</option>
        </select>
      </label>
      <div className="flex items-center gap-2 pt-2">
        <button className="rounded border border-slate-700 px-3 py-1" onClick={onRecord}>
          Record 30s
        </button>
        <button
          className="rounded border border-slate-700 px-3 py-1"
          onClick={onStopRecording}
        >
          Stop
        </button>
        {recordingUrl && (
          <a
            href={recordingUrl}
            download="ca-music.webm"
            className="rounded bg-accent px-3 py-1 text-slate-950"
          >
            Download
          </a>
        )}
      </div>
    </div>
  );
}
