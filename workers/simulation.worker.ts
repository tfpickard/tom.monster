import {
  createSimulationState,
  randomize,
  stepSimulation,
} from "../src/lib/ca/simulator";
import type { SimulationState } from "../src/lib/ca/simulator";
import { hashCells } from "../src/lib/ca/zobrist";
import type {
  SimulationWorkerMessage,
  SimulationWorkerResponse,
} from "../src/lib/ipc/messages";

const ctx: DedicatedWorkerGlobalScope = self as unknown as DedicatedWorkerGlobalScope;

let state: SimulationState | null = null;
let timer: ReturnType<typeof setInterval> | null = null;

function post(message: SimulationWorkerResponse) {
  ctx.postMessage(message);
}

function emitSnapshot() {
  if (!state) return;
  let population = 0;
  for (let i = 0; i < state.cells.length; i++) {
    population += state.cells[i];
  }
  post({
    type: "frame",
    frame: {
      generation: state.generation,
      population,
      hash: hashCells(state.cells, state.zobrist),
      terminated: state.terminated,
      reason: state.termination,
      period: state.period,
      cells: state.cells.slice(),
    },
  });
}

function sendFrame() {
  if (!state) return;
  const frame = stepSimulation(state);
  post({ type: "frame", frame });
  if (frame.terminated && timer) {
    clearInterval(timer);
    timer = null;
  }
}

ctx.onmessage = (event: MessageEvent<SimulationWorkerMessage>) => {
  const message = event.data;
  switch (message.type) {
    case "init":
      state = createSimulationState(message.config, (cells) => {
        if (message.seed) {
          cells.set(message.seed);
        }
      });
      post({ type: "ready" });
      emitSnapshot();
      break;
    case "step":
      sendFrame();
      break;
    case "run":
      if (timer) clearInterval(timer);
      timer = setInterval(
        () => sendFrame(),
        Math.max(16, 1000 / Math.max(1, message.speed)),
      );
      break;
    case "pause":
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
      break;
    case "randomize":
      if (!state) break;
      randomize(state, message.density);
      emitSnapshot();
      break;
    case "load":
      if (!state) break;
      state = createSimulationState(state.config, (cells) => {
        cells.set(message.cells.subarray(0, cells.length));
      });
      emitSnapshot();
      break;
    case "benchmark":
      if (!state) break;
      const start = performance.now();
      let steps = 0;
      while (performance.now() - start < message.duration) {
        sendFrame();
        steps++;
      }
      post({
        type: "benchmark",
        generationsPerSecond: (steps / message.duration) * 1000,
      });
      break;
  }
};
