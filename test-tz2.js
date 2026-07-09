const { format, toZonedTime, utcToZonedTime } = require('date-fns-tz');
const now = new Date('2026-07-09T07:00:00Z');
console.log('Available exports:', Object.keys(require('date-fns-tz')));
try {
  console.log('With options:', format(now, 'H', { timeZone: 'UTC' }));
} catch(e) { console.log(e); }
