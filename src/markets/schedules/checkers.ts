import { DateTime, IANAZone } from "luxon";
import { getWeeklySchedule, TradFiMarket } from "./index";
import { Window, WeekDay, weekDayToKey } from "./types";

const ET = IANAZone.create("America/New_York");

const weekdayKey = (weekday: number) => weekDayToKey(weekday as WeekDay); // Luxon: Mon=1..Sun=7

const inInAnyWindow = (mm: number, wins: Window[] | undefined): boolean =>
  !!wins?.some(w => {
    const start = w.start.hour * 60 + w.start.minute;
    const end =
      w.end.hour === 24 && w.end.minute === 0
        ? 1440
        : w.end.hour * 60 + w.end.minute;
    return mm >= start && mm < end;
  });

export const isOpenAt = (
  market: TradFiMarket,
  date: Date,
  opts?: { pairGroupIndex?: number }
): boolean => {
  const dt = DateTime.fromJSDate(date).setZone(ET);
  const schedule = getWeeklySchedule(market, date, opts);

  const dayKey = weekdayKey(dt.weekday);
  const mm = dt.hour * 60 + dt.minute;

  // Holiday override: if this ET date has a holiday entry, use its openWindows
  const h = schedule.holidays?.find(
    x => x.month === dt.month && x.day === dt.day
  );
  if (h) {
    return inInAnyWindow(mm, h.openWindows);
  }

  return inInAnyWindow(mm, (schedule.open as any)[dayKey]);
};

export const isLowLiquidityAt = (
  market: TradFiMarket,
  date: Date,
  opts?: { pairGroupIndex?: number }
): boolean => {
  const dt = DateTime.fromJSDate(date).setZone(ET);
  const schedule = getWeeklySchedule(market, date, opts);
  const dayKey = weekdayKey(dt.weekday);
  const mm = dt.hour * 60 + dt.minute;
  return inInAnyWindow(mm, (schedule.lowLiq as any)[dayKey]);
};
