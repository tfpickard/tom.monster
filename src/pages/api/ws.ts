import type { NextApiRequest, NextApiResponse } from "next";
import { WebSocketServer } from "ws";

import { addToRoom } from "@/lib/server/wsHub";

type SocketServer = NextApiResponse["socket"] & {
  server: {
    wss?: WebSocketServer;
  };
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const socket = res.socket as SocketServer;
  if (!socket?.server) {
    res.status(500).end();
    return;
  }

  if (!res.socket.server.wss) {
    const wss = new WebSocketServer({ noServer: true });
    res.socket.server.on("upgrade", (request, socket, head) => {
      if (!request.url?.startsWith("/api/ws")) return;
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    });
    wss.on("connection", (socket, request) => {
      const url = new URL(request.url ?? "", "http://localhost");
      const room = url.searchParams.get("room") ?? "sim:live";
      addToRoom(room, socket);
      socket.send(JSON.stringify({ type: "welcome", room }));
    });
    res.socket.server.wss = wss;
  }
  res.end();
}
