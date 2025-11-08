import { runGeneticSearch } from "../src/lib/ga/engine";
import type { GAWorkerMessage, GAWorkerResponse } from "../src/lib/ipc/messages";

const ctx: DedicatedWorkerGlobalScope = self as unknown as DedicatedWorkerGlobalScope;

let cancelled = false;

function post(message: GAWorkerResponse) {
  ctx.postMessage(message);
}

ctx.onmessage = (event: MessageEvent<GAWorkerMessage>) => {
  const message = event.data;
  switch (message.type) {
    case "run":
      cancelled = false;
      const result = runGeneticSearch(message.config, {
        iterations: message.options.iterations,
        seedWindow: message.options.seedWindow,
        onProgress: (data) => post({ type: "progress", data }),
        shouldCancel: () => cancelled,
      });
      if (!cancelled) {
        post({ type: "result", genome: result.bestGenome, fitness: result.bestFitness });
      }
      break;
    case "cancel":
      cancelled = true;
      break;
  }
};
