import { processDailyDigest } from './src/lib/calendar-notifications';
async function test() {
  console.log("Starting test");
  await processDailyDigest();
  console.log("Done");
}
test();
