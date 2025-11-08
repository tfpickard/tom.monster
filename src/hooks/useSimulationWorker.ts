"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { SimulationConfig, SimulationFrame } from "@/lib/ca/types";
import type {
  SimulationWorkerMessage,
  SimulationWorkerResponse,
} from "@/lib/ipc/messages";

type FrameHandler = (frame: SimulationFrame) => void;

export function useSimulationWorker(config: SimulationConfig, onFrame: FrameHandler) {
  const workerRef = useRef<Worker>();
  const [isReady, setReady] = useState(false);
  const [benchmark, setBenchmark] = useState<number | null>(null);
  const frameHandlerRef = useRef<FrameHandler>(onFrame);

  useEffect(() => {
    frameHandlerRef.current = onFrame;
  }, [onFrame]);

  useEffect(() => {
    const worker = new Worker(
      new URL("../../workers/simulation.worker.ts", import.meta.url),
      {
        type: "module",
      },
    );
    workerRef.current = worker;
    const handleMessage = (event: MessageEvent<SimulationWorkerResponse>) => {
      if (event.data.type === "ready") {
        setReady(true);
      }
      if (event.data.type === "frame") {
        frameHandlerRef.current(event.data.frame);
      }
      if (event.data.type === "benchmark") {
        setBenchmark(event.data.generationsPerSecond);
      }
    };
    worker.addEventListener("message", handleMessage);
    worker.postMessage({ type: "init", config } satisfies SimulationWorkerMessage);
    return () => {
      worker.removeEventListener("message", handleMessage);
      worker.terminate();
    };
  }, [config]);

  const send = useCallback((message: SimulationWorkerMessage) => {
    workerRef.current?.postMessage(message);
  }, []);

  const step = useCallback(() => send({ type: "step" }), [send]);
  const run = useCallback((speed: number) => send({ type: "run", speed }), [send]);
  const pause = useCallback(() => send({ type: "pause" }), [send]);
  const randomize = useCallback(
    (density: number) => send({ type: "randomize", density }),
    [send],
  );
  const load = useCallback((cells: Uint8Array) => send({ type: "load", cells }), [send]);
  const benchmarkSim = useCallback(
    (duration = 2000) => send({ type: "benchmark", duration }),
    [send],
  );

  return {
    isReady,
    step,
    run,
    pause,
    randomize,
    load,
    benchmark: benchmark ?? undefined,
    benchmarkSim,
  };
}
