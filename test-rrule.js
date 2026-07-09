const { RRule } = require('rrule');
const rule = RRule.fromString('FREQ=MONTHLY');
const now = new Date();
const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
console.log(rule.between(now, tomorrow, true));
