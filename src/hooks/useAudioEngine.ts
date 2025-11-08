"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Tone from "tone";

import { mapCellsToNotes, MappingId } from "@/lib/music/mapping";
import { parseCustomScale, tunings, TuningId } from "@/lib/music/tunings";

interface UseAudioEngineArgs {
  tuning: TuningId;
  customScale: string;
  lattice: "square" | "hex";
  width: number;
  height: number;
  strategy: MappingId;
  tempo: number;
  maxNotes: number;
}

export function useAudioEngine(config: UseAudioEngineArgs) {
  const [isReady, setReady] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const schedulerRef = useRef<Tone.Loop | null>(null);
  const queuedCellsRef = useRef<Uint8Array | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mediaDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const synthsRef = useRef<{
    percussive: Tone.MembraneSynth;
    plucked: Tone.PluckSynth;
    pad: Tone.PolySynth;
  }>();

  const scale = useMemo(() => {
    if (config.tuning === "custom") {
      return parseCustomScale(config.customScale);
    }
    return tunings[config.tuning].frequencies();
  }, [config.customScale, config.tuning]);

  useEffect(() => {
    Tone.Transport.bpm.value = config.tempo;
  }, [config.tempo]);

  const ensureEngine = useCallback(async () => {
    await Tone.start();
    if (!synthsRef.current) {
      synthsRef.current = {
        percussive: new Tone.MembraneSynth({
          octaves: 2,
          pitchDecay: 0.05,
        }).toDestination(),
        plucked: new Tone.PluckSynth().toDestination(),
        pad: new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: "sine" },
          envelope: { attack: 0.2, release: 1.4 },
        }).toDestination(),
      };
    }
    schedulerRef.current?.dispose();
    schedulerRef.current = new Tone.Loop((time) => {
      const cells = queuedCellsRef.current;
      if (!cells) {
        return;
      }
      queuedCellsRef.current = null;
      const notes = mapCellsToNotes(cells, {
        lattice: config.lattice,
        width: config.width,
        height: config.height,
        tuning: scale,
        maxNotes: config.maxNotes,
        strategy: config.strategy,
      });
      notes.forEach((note, idx) => {
        const eventTime = time + idx * 0.03;
        const velocity = Math.min(1, Math.max(0.2, note.velocity));
        switch (note.voice) {
          case "percussive":
            synthsRef.current?.percussive.triggerAttackRelease(
              note.frequency,
              "8n",
              eventTime,
              velocity,
            );
            break;
          case "pad":
            synthsRef.current?.pad.triggerAttackRelease(
              note.frequency,
              "2n",
              eventTime,
              velocity,
            );
            break;
          default:
            synthsRef.current?.plucked.triggerAttackRelease(
              note.frequency,
              "8n",
              eventTime,
              velocity,
            );
        }
      });
    }, "16n").start(0);
    Tone.Transport.start();
    setReady(true);
  }, [
    config.height,
    config.lattice,
    config.maxNotes,
    config.strategy,
    config.width,
    scale,
  ]);

  const triggerNotes = useCallback(
    async (cells: Uint8Array) => {
      await ensureEngine();
      queuedCellsRef.current = cells.slice();
    },
    [ensureEngine],
  );

  const startRecording = useCallback(async () => {
    await ensureEngine();
    if (recorderRef.current) return;
    const dest = Tone.getContext().rawContext.createMediaStreamDestination();
    Tone.getDestination().connect(dest);
    mediaDestRef.current = dest;
    const recorder = new MediaRecorder(dest.stream);
    recorder.ondataavailable = (evt) => {
      if (evt.data.size) {
        chunksRef.current.push(evt.data);
      }
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm;codecs=opus" });
      chunksRef.current = [];
      setRecordingUrl(URL.createObjectURL(blob));
    };
    recorder.start();
    recorderRef.current = recorder;
    setTimeout(() => recorder.stop(), 30_000);
  }, [ensureEngine]);

  const stopRecording = useCallback(() => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    if (mediaDestRef.current) {
      Tone.getDestination().disconnect(mediaDestRef.current);
    }
    mediaDestRef.current = null;
  }, []);

  return {
    isReady,
    triggerNotes,
    startRecording,
    stopRecording,
    recordingUrl,
  };
}
