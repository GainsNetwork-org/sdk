export * from "./types";
export {
  buildForexWeeklySchedule,
  buildStocksWeeklySchedule,
  buildIndicesWeeklySchedule,
  buildCommoditiesWeeklySchedule,
} from "./builders";
export { isOpenAt, isLowLiquidityAt } from "./checkers";
export { getHolidays, getHolidaysInCurrentWeek } from "./holidays";

import { Schedule } from "./types";
import {
  buildForexWeeklySchedule,
  buildStocksWeeklySchedule,
  buildIndicesWeeklySchedule,
  buildCommoditiesWeeklySchedule,
} from "./builders";

export type TradFiMarket = "forex" | "stocks" | "indices" | "commodities";

export const getWeeklySchedule = (
  market: TradFiMarket,
  currentDate: Date = new Date(),
  opts?: { pairGroupIndex?: number }
): Schedule => {
  switch (market) {
    case "forex":
      return buildForexWeeklySchedule(currentDate, {
        pairGroupIndex: opts?.pairGroupIndex,
      });
    case "stocks":
      return buildStocksWeeklySchedule(currentDate);
    case "indices":
      return buildIndicesWeeklySchedule(currentDate);
    case "commodities":
      return buildCommoditiesWeeklySchedule(currentDate);
  }
};
