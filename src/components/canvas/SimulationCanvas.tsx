"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { LatticeType } from "@/lib/ca/types";

interface Props {
  cells?: Uint8Array;
  width: number;
  height: number;
  lattice: LatticeType;
}

export function SimulationCanvas({ cells, width, height, lattice }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [zoom, setZoom] = useState(4);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!cells) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#22d3ee";
    for (let i = 0; i < cells.length; i++) {
      if (!cells[i]) continue;
      const x = i % width;
      const y = Math.floor(i / width);
      ctx.fillRect(x, y, 1, 1);
    }
    ctx.restore();
  }, [cells, height, pan.x, pan.y, width, zoom, lattice]);

  const handleWheel = useCallback((event: React.WheelEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const delta = Math.sign(event.deltaY);
    setZoom((z) => Math.max(1, Math.min(16, delta > 0 ? z - 0.5 : z + 0.5)));
  }, []);

  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      dragging.current = true;
      last.current = { x: event.clientX, y: event.clientY };
    },
    [],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (!dragging.current) return;
      const dx = event.clientX - last.current.x;
      const dy = event.clientY - last.current.y;
      setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      last.current = { x: event.clientX, y: event.clientY };
    },
    [],
  );

  const handlePointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full rounded-lg border border-slate-800 bg-slate-950"
      width={width * zoom}
      height={height * zoom}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    />
  );
}
