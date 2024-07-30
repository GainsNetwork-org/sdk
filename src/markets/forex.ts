/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// @ts-ignore-file
import { DateTime, IANAZone } from "luxon";
import { Pair } from "src/trade";

const FOREX_MARKETS_TIME_ZONE_IANA = IANAZone.create("America/New_York");

export const isForexOpen = (dateToCheck: Date): boolean => {
  const now: DateTime = DateTime.fromJSDate(dateToCheck).setZone(
    FOREX_MARKETS_TIME_ZONE_IANA
  );
  const weekday = now.weekday;
  const hour = now.hour;
  const dayOfMonth = now.day;
  const month = now.month;
  const isInDST = now.isInDST;

  const isClosed =
    // Christmas 2023
    (month === 12 && dayOfMonth >= 25 && dayOfMonth <= 27) ||
    // New Year's Eve 2023
    (month === 1 && dayOfMonth >= 1 && dayOfMonth <= 2) ||
    // Friday after 4PM (DST) and 5PM (non-DST)
    (weekday === 5 && ((isInDST && hour >= 16) || hour >= 17)) ||
    // Saturday
    weekday === 6 ||
    // Sunday before 4PM (DST) and 5PM (non-DST)
    (weekday === 7 && ((isInDST && hour < 16) || hour < 17));

  return !isClosed;
};

const extendedLowLiqGroupIds = [8, 9];
export const isForexLowLiquidity = (timestampToCheck: number, pair?: Pair) => {
  const now = DateTime.fromMillis(timestampToCheck).setZone(
    FOREX_MARKETS_TIME_ZONE_IANA
  );
  const hour = now.hour;
  const minute = now.minute;
  const isInDST = now.isInDST;

  const groupIndex = pair?.groupIndex;
  if (groupIndex && extendedLowLiqGroupIds.includes(+groupIndex)) {
    return (
      (isInDST &&
        ((hour == 14 && minute >= 45) || (hour >= 15 && hour < 21))) ||
      (!isInDST && ((hour == 15 && minute >= 45) || (hour >= 16 && hour < 22)))
    );
  }

  return (
    (isInDST && ((hour == 15 && minute >= 45) || (hour >= 16 && hour < 19))) ||
    (!isInDST && ((hour == 16 && minute >= 45) || (hour >= 17 && hour < 20)))
  );
};
