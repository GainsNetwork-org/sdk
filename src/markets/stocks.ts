/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// @ts-ignore-file
import { DateTime, IANAZone } from "luxon";

const STOCKS_MARKETS_TIME_ZONE_IANA = IANAZone.create("America/New_York");

export const isStocksOpen = (dateToCheck: Date): boolean => {
  const now: DateTime = DateTime.fromJSDate(dateToCheck).setZone(
    STOCKS_MARKETS_TIME_ZONE_IANA
  );
  const weekday = now.weekday;
  const hour = now.hour;
  const dayOfMonth = now.day;
  const month = now.month;
  const minute = now.minute;

  const isClosed =
    // New Year's Day 2026
    (month === 1 && dayOfMonth === 1) ||
    // Martin Luther King, Jr. Day 2026
    (month === 1 && dayOfMonth === 19) ||
    // Presidents' Day 2026
    (month === 2 && dayOfMonth === 16) ||
    // Good Friday 2026
    (month === 4 && dayOfMonth === 3) ||
    // Memorial Day 2025
    (month === 5 && dayOfMonth === 26) ||
    // Juneteenth National Independence Day 2025
    (month === 6 && dayOfMonth === 19) ||
    // Independence Day 2025
    (month === 7 && dayOfMonth === 4) ||
    // Labor Day 2025
    (month === 9 && dayOfMonth === 1) ||
    // Thanksgiving Day 2025
    (month === 11 && dayOfMonth === 27) ||
    // Black Friday 2025 (closes early at 1PM)
    (month === 11 && dayOfMonth === 28 && hour >= 13) ||
    // Christmas Eve 2025 (closes early at 1PM)
    (month === 12 && dayOfMonth === 24 && hour >= 13) ||
    // Christmas Day 2025
    (month === 12 && dayOfMonth === 25) ||
    // Day before Independence Day 2025 (closes early at 1PM)
    (month === 7 && dayOfMonth === 3 && hour >= 13) ||
    // Saturday
    weekday === 6 ||
    // Sunday
    weekday === 7 ||
    // Mo-Fr Daily Opening
    hour < 9 ||
    (hour === 9 && minute < 30) ||
    // Mo-Fr Daily Closing
    hour >= 16;

  return !isClosed;
};

export const getUSMarketsNow = () => {
  return DateTime.now().setZone(STOCKS_MARKETS_TIME_ZONE_IANA);
};
