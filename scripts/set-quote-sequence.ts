import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const [result] = await prisma.$queryRawUnsafe<[{ max: number }]>(
    `SELECT GREATEST(COALESCE(MAX("correlativo"), 0), 99) AS max FROM "Quote"`
  );

  const nextValue = result.max;
  console.log(`Setting Quote.correlativo sequence start to ${nextValue + 1} if nextval is called.`);

  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"Quote"', 'correlativo'), $1, false);`,
    nextValue
  );

  console.log('Quote correlativo sequence fixed.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
