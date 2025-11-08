import { NextResponse } from "next/server";
import type { Preset } from "@prisma/client";

import { prisma } from "@/lib/prisma";

interface Context {
  params: { id: string };
}

export async function GET(_: Request, context: Context) {
  const preset = await prisma.preset.findUnique({
    where: { id: context.params.id },
  });
  if (!preset) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({
    ...preset,
    seedCells: JSON.parse(preset.seedCells as string),
  });
}
