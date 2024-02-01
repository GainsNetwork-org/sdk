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
    (month === 12 && dayOfMonth >= 25 && dayOfMonth <= 27) ||
    // New Year's Eve 2023
    (month === 1 && dayOfMonth >= 1 && dayOfMonth <= 2) ||
    // Friday Closing
    (weekday === 5 && hour >= 17) ||
    // Saturday Closed
    weekday === 6 ||
    // Saturday Opening
    (weekday === 7 && hour <= 18) ||
    // Daily Closing
    hour === 17;

  return !isClosed;
};
