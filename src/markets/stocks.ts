/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// @ts-ignore-file
import { DateTime, IANAZone } from "luxon";
import { isOpenAt } from "./schedules";

const STOCKS_MARKETS_TIME_ZONE_IANA = IANAZone.create("America/New_York");

export const isStocksOpen = (dateToCheck: Date): boolean => isOpenAt('stocks', dateToCheck);

export const getUSMarketsNow = () => {
  return DateTime.now().setZone(STOCKS_MARKETS_TIME_ZONE_IANA);
};
