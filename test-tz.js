const { format } = require('date-fns-tz');
const now = new Date('2026-07-09T07:00:00Z');
console.log('America/Santiago hour:', format(now, 'H', { timeZone: 'America/Santiago' }));
console.log('UTC hour:', format(now, 'H', { timeZone: 'UTC' }));
