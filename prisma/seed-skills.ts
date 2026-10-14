import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SKILLS: Record<number, string[]> = {
  1: ['Deep cleaning', 'Kitchen cleaning', 'Bathroom cleaning', 'Window cleaning'],
  9: ['Wiring', 'Switchboard repair', 'Fan installation', 'Inverter setup'],
  10: ['Pipe repair', 'Tap fitting', 'Drain cleaning'],
};

async function main() {
  for (const [categoryId, names] of Object.entries(SKILLS)) {
    for (const name of names) {
      await prisma.skill.upsert({
        where: { categoryId_name: { categoryId: Number(categoryId), name } },
        update: {},
        create: { categoryId: Number(categoryId), name },
      });
    }
  }
  console.log('Skills seeded');
}

main().finally(() => prisma.$disconnect());
