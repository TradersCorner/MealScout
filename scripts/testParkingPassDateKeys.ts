import assert from "node:assert/strict";
import {
  addDaysToDateKey,
  dateKeyFromUnknown,
  dateKeyInZone,
  utcDateFromDateKey,
  weekdayInZoneForDateKey,
} from "../server/services/dateKeys";

const run = () => {
  // DST edge: UTC midnight should map to prior local day in US timezones when expected.
  const utcMidnight = new Date("2026-03-08T00:00:00.000Z");
  assert.equal(dateKeyInZone(utcMidnight, "America/Chicago"), "2026-03-07");

  assert.equal(addDaysToDateKey("2026-02-27", 2), "2026-03-01");
  assert.equal(
    utcDateFromDateKey("2026-04-05").toISOString(),
    "2026-04-05T00:00:00.000Z",
  );

  assert.equal(dateKeyFromUnknown("2026-05-15", "America/Chicago"), "2026-05-15");
  assert.equal(dateKeyFromUnknown("2026-05-15T14:30:00.000Z", "America/Chicago"), "2026-05-15");
  assert.equal(weekdayInZoneForDateKey("2026-03-08", "America/Chicago"), 0); // Sunday

  console.log("dateKeys checks passed");
};

run();
