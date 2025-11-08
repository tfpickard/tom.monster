"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { GAConfig, GARunProgress, Genome } from "@/lib/ga/types";
import type { GAWorkerMessage, GAWorkerResponse } from "@/lib/ipc/messages";

export function useGaWorker(
  config: GAConfig & { iterations: number; seedWindow: number },
) {
  const workerRef = useRef<Worker>();
  const [progress, setProgress] = useState<GARunProgress | null>(null);
  const [result, setResult] = useState<{ genome: Genome; fitness: number } | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL("../../workers/ga.worker.ts", import.meta.url),
      {
        type: "module",
      },
    );
    return () => workerRef.current?.terminate();
  }, []);

  const send = useCallback((message: GAWorkerMessage) => {
    workerRef.current?.postMessage(message);
  }, []);

  useEffect(() => {
    const worker = workerRef.current;
    if (!worker) return;
    const handleMessage = (event: MessageEvent<GAWorkerResponse>) => {
      if (event.data.type === "progress") {
        setProgress(event.data.data);
      }
      if (event.data.type === "result") {
        setResult({ genome: event.data.genome, fitness: event.data.fitness });
        setRunning(false);
      }
    };
    worker.addEventListener("message", handleMessage);
    return () => worker.removeEventListener("message", handleMessage);
  }, []);

  const run = useCallback(() => {
    setRunning(true);
    setResult(null);
    setProgress(null);
    send({
      type: "run",
      config,
      options: { iterations: config.iterations, seedWindow: config.seedWindow },
    });
  }, [config, send]);

  const cancel = useCallback(() => {
    send({ type: "cancel" });
    setRunning(false);
  }, [send]);

  return { run, cancel, running, progress, result };
}
