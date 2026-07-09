const { PrismaClient } = require('@prisma/client');
const { RRule } = require('rrule');
const prisma = new PrismaClient();

async function main() {
  const events = await prisma.calendarEvent.findMany({
    where: { recurrenceRule: { not: null } }
  });
  
  for (const event of events) {
    console.log('\n--- Event:', event.title);
    let ruleStr = event.recurrenceRule;
    console.log('Original Rule:', ruleStr);
    console.log('Start Date:', event.start.toISOString());
    
    if (!ruleStr.includes('DTSTART')) {
      const dtstartStr = event.start.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
      ruleStr = `DTSTART:${dtstartStr}\nRRULE:${ruleStr}`;
    }
    console.log('Final Rule Str:', ruleStr);
    
    const rule = RRule.fromString(ruleStr);
    console.log('Parsed dtstart:', rule.options.dtstart);
    console.log('Parsed freq:', rule.options.freq);
    console.log('Parsed bymonthday:', rule.options.bymonthday);
    
    const today = new Date('2026-07-09T00:00:00.000Z');
    const tomorrow = new Date('2026-07-10T00:00:00.000Z');
    const occs = rule.between(today, tomorrow, true);
    console.log('Occurrences today:', occs);
  }
}
main().finally(() => prisma.$disconnect());
