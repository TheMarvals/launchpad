const { rrulestr } = require('rrule');
const start = new Date('2026-07-20T14:30:00.000Z');
const rule = rrulestr('FREQ=MONTHLY', { dtstart: start });
console.log('dtstart:', rule.options.dtstart);
console.log('occurrences:', rule.between(new Date('2026-07-08T00:00:00.000Z'), new Date('2026-07-09T00:00:00.000Z'), true));
