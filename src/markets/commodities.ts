/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// @ts-ignore-file
import { DateTime, IANAZone } from "luxon";

const COMMODITIES_MARKETS_TIME_ZONE_IANA = IANAZone.create("America/New_York");

export const isCommoditiesOpen = (dateToCheck: Date): boolean => {
  const now: DateTime = DateTime.fromJSDate(dateToCheck).setZone(
    COMMODITIES_MARKETS_TIME_ZONE_IANA
  );
  const weekday = now.weekday;
  const hour = now.hour;
  const dayOfMonth = now.day;
  const month = now.month;
  const minute = now.minute;

  const isClosed =
    // Christmas 2023
    (month === 12 && dayOfMonth >= 24) ||
    // New Year's Eve 2023
    (month === 1 && dayOfMonth >= 1 && dayOfMonth <= 2) ||
    // Friday Closing: After 4:30 PM (Friday is closed for the whole day after 4:30 PM)
    (weekday === 5 && (hour > 16 || (hour === 16 && minute >= 30))) ||
    // Sunday Closing: before 7:30 PM (closed until Sunday 7:30 PM)
    (weekday === 7 && (hour < 19 || (hour === 19 && minute < 30))) ||
    // Saturday Closed
    weekday === 6 ||
    // Daily Closing: 4:30 PM to 6:30 PM (every day except Friday after 4:30 PM)
    (hour === 16 && minute >= 30) || // 4:30 PM to 5:00 PM
    hour === 17 || // 5:00 PM to 6:00 PM
    (hour === 18 && minute <= 30); // 6:00 PM to 6:30 PM

  return !isClosed;
};
