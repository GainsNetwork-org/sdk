/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// @ts-ignore-file
import { DateTime, IANAZone } from "luxon";

const FOREX_MARKETS_TIME_ZONE_IANA = IANAZone.create("America/New_York");

export const isForexOpen = (dateToCheck: Date): boolean => {
  const now: DateTime = DateTime.fromJSDate(dateToCheck).setZone(
    FOREX_MARKETS_TIME_ZONE_IANA
  );
  const weekday = now.weekday;
  const hour = now.hour;
  const dateOfMonth = now.day;
  const month = now.month;
  const isInDST = now.isInDST;

  const isClosed =
    // Christmas 2023
    (month === 12 && dateOfMonth >= 25 && dateOfMonth <= 27) ||
    // New Year's Eve 2023
    (month === 1 && dateOfMonth >= 1 && dateOfMonth <= 2) ||
    // Friday after 4PM (DST) and 5PM (non-DST)
    (weekday === 5 && ((isInDST && hour >= 16) || hour >= 17)) ||
    // Saturday
    weekday === 6 ||
    // Sunday before 4PM (DST) and 5PM (non-DST)
    (weekday === 7 && ((isInDST && hour < 16) || hour < 17));

  return !isClosed;
};
