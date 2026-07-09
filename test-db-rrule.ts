const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const events = await prisma.calendarEvent.findMany({
    where: { recurrenceRule: { not: null } }
  });
  console.log(events.map((e: any) => ({ title: e.title, rule: e.recurrenceRule, start: e.start })));
}
main().finally(() => prisma.$disconnect());
