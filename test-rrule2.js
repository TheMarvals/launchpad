const { RRule, rrulestr } = require('rrule');

const event = {
  start: new Date('2026-07-20T14:30:00.000Z'),
  rule: 'FREQ=MONTHLY'
};

const rule1 = RRule.fromString(event.rule);
console.log('Rule 1 dtstart:', rule1.options.dtstart);

const rule2 = rrulestr(`DTSTART:${event.start.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}\nRRULE:${event.rule}`);
console.log('Rule 2 dtstart:', rule2.options.dtstart);

const today = new Date('2026-07-08T00:00:00.000Z');
const tomorrow = new Date('2026-07-09T00:00:00.000Z');

console.log('Occurrences rule1:', rule1.between(today, tomorrow, true));
console.log('Occurrences rule2:', rule2.between(today, tomorrow, true));

