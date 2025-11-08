import { NextResponse } from "next/server";
import { z } from "zod";

import { broadcast } from "@/lib/server/wsHub";
import { prisma } from "@/lib/prisma";
import { safeParseRule } from "@/lib/ca/rules";
import { createSimulationState, stepSimulation } from "@/lib/ca/simulator";

const runSchema = z.object({
  rule: z.string().default("B3/S23"),
  lattice: z.enum(["square", "hex"]).default("square"),
  width: z.number().min(32).max(256).default(100),
  height: z.number().min(32).max(256).default(100),
  toroidal: z.boolean().default(false),
  seedCells: z.array(z.tuple([z.number(), z.number()])).default([]),
  maxGenerations: z.number().min(64).max(50000).default(50000),
  presetId: z.string().optional(),
});

async function startHeadlessRun(id: string, input: z.infer<typeof runSchema>) {
  const config = {
    lattice: input.lattice,
    width: input.width,
    height: input.height,
    rule: safeParseRule(input.rule),
    toroidal: input.toroidal,
    maxPeriod: 50,
  };
  const state = createSimulationState(config, (cells) => {
    for (const [x, y] of input.seedCells) {
      if (x >= 0 && x < input.width && y >= 0 && y < input.height) {
        cells[y * input.width + x] = 1;
      }
    }
  });

  let finalFrame = null;
  for (let i = 0; i < input.maxGenerations; i++) {
    const frame = stepSimulation(state);
    const payload = {
      type: "frame" as const,
      frame: { ...frame, cells: Array.from(frame.cells) },
    };
    broadcast(`runs:${id}`, payload);
    broadcast("sim:live", payload);
    finalFrame = frame;
    if (frame.terminated) break;
  }

  await prisma.run.update({
    where: { id },
    data: {
      finishedAt: new Date(),
      result: JSON.stringify({
        terminated: finalFrame?.terminated ?? false,
        reason: finalFrame?.reason ?? "cap",
      }),
      fitness: finalFrame?.generation ?? 0,
      summary: JSON.stringify({ population: finalFrame?.population ?? 0 }),
    },
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = runSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(parsed.error.format(), { status: 400 });
  }

  const run = await prisma.run.create({
    data: {
      presetId: parsed.data.presetId,
      params: JSON.stringify(parsed.data),
      fitness: 0,
      summary: JSON.stringify({}),
      result: JSON.stringify({ terminated: false }),
    },
  });

  startHeadlessRun(run.id, parsed.data);

  return NextResponse.json({ id: run.id }, { status: 202 });
}
