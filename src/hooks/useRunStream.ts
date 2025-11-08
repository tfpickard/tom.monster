"use client";

import { useEffect } from "react";

import type { SimulationFrame } from "@/lib/ca/types";
import { useSimStore } from "@/state/simStore";

export function useRunStream(room = "sim:live") {
  const setRemoteFrame = useSimStore((state) => state.setRemoteFrame);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let closed = false;
    let socket: WebSocket | null = null;
    fetch("/api/ws")
      .catch(() => undefined)
      .finally(() => {
        if (closed) return;
        const origin = window.location.origin.replace("http", "ws");
        socket = new WebSocket(`${origin}/api/ws?room=${encodeURIComponent(room)}`);
        socket.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data) as {
              type: string;
              frame?: Omit<SimulationFrame, "cells"> & { cells: number[] };
            };
            if (payload.type === "frame" && payload.frame) {
              setRemoteFrame({
                ...payload.frame,
                cells: new Uint8Array(payload.frame.cells),
              });
            }
          } catch (err) {
            console.error(err);
          }
        };
        socket.onclose = () => {
          closed = true;
        };
      });
    return () => {
      closed = true;
      socket?.close();
    };
  }, [room, setRemoteFrame]);
}
