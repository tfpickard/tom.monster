import { nanoid } from "nanoid";

import { prisma } from "@/lib/prisma";

export async function ensureGuest(anonId?: string) {
  const id = anonId ?? `guest_${nanoid(8)}`;
  const user = await prisma.user.upsert({
    where: { anonId: id },
    update: {},
    create: { anonId: id },
  });
  return user;
}
