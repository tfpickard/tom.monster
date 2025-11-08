import { PrismaClient } from "@prisma/client";

import { builtInSeeds } from "../src/lib/ca/seeds";

const prisma = new PrismaClient();

async function main() {
  const demoUser = await prisma.user.upsert({
    where: { anonId: "demo" },
    update: {},
    create: { anonId: "demo" },
  });

  for (const seed of builtInSeeds) {
    await prisma.preset.upsert({
      where: { id: seed.id },
      update: {},
      create: {
        id: seed.id,
        name: seed.name,
        description: seed.description,
        rule: seed.rule,
        latticeType: seed.lattice,
        gridWidth: seed.width,
        gridHeight: seed.height,
        seedCells: JSON.stringify(seed.cells),
        userId: demoUser.id,
      },
    });
  }

  await prisma.run.create({
    data: {
      params: JSON.stringify({ populationSize: 32, mutationRate: 0.2 }),
      result: JSON.stringify({ terminated: true, reason: "periodic" }),
      fitness: 2000,
      summary: JSON.stringify({ notes: "Demo GA config" }),
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
