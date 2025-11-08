import type { WebSocket } from "ws";

type Hub = {
  rooms: Map<string, Set<WebSocket>>;
};

const globalHub = globalThis as unknown as { wsHub?: Hub };

function ensureHub(): Hub {
  if (!globalHub.wsHub) {
    globalHub.wsHub = { rooms: new Map() };
  }
  return globalHub.wsHub;
}

export function addToRoom(room: string, socket: WebSocket) {
  const hub = ensureHub();
  const peers = hub.rooms.get(room) ?? new Set<WebSocket>();
  peers.add(socket);
  hub.rooms.set(room, peers);
  socket.on("close", () => {
    peers.delete(socket);
  });
}

export function broadcast(room: string, payload: unknown) {
  const hub = ensureHub();
  const peers = hub.rooms.get(room);
  if (!peers) return;
  const data = JSON.stringify(payload);
  for (const socket of peers) {
    if (socket.readyState === socket.OPEN) {
      socket.send(data);
    }
  }
}
