import { NextResponse } from "next/server";
import { z } from "zod";
import type { Preset } from "@prisma/client";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const presetSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  rule: z.string(),
  latticeType: z.enum(["square", "hex"]),
  gridWidth: z.number().min(8).max(256),
  gridHeight: z.number().min(8).max(256),
  seedCells: z.array(z.tuple([z.number(), z.number()])),
});

function deserializePreset(preset: Preset) {
  return {
    ...preset,
    seedCells: JSON.parse(preset.seedCells as string),
  };
}

export async function GET() {
  const presets = await prisma.preset.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(presets.map(deserializePreset));
}

export async function POST(request: Request) {
  const body = await request.json();
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = presetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(parsed.error.format(), { status: 400 });
  }

  const preset = await prisma.preset.create({
    data: {
      ...parsed.data,
      seedCells: JSON.stringify(parsed.data.seedCells),
      userId: session.user.id,
    },
  });
  return NextResponse.json(deserializePreset(preset), { status: 201 });
}
