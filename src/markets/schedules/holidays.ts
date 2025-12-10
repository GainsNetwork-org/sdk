import { DateTime, IANAZone } from "luxon";
import { Holiday, Window } from "./types";

const ET = IANAZone.create("America/New_York");

// Holiday definitions per year (ET calendar). For full-day closure, openWindows: []
const stocksFullDay = (month: number, day: number, name: string): Holiday => ({ month, day, name, openWindows: [] });
const addWindows = (startH: number, startM: number, endH: number, endM: number): Window => ({ start: { hour: startH, minute: startM }, end: { hour: endH, minute: endM } });

const HOLIDAYS_2025: Holiday[] = [
  stocksFullDay(5, 26, "Memorial Day"),
  stocksFullDay(6, 19, "Juneteenth"),
  stocksFullDay(7, 4, "Independence Day"),
  stocksFullDay(9, 1, "Labor Day"),
  stocksFullDay(11, 27, "Thanksgiving Day"),
  stocksFullDay(12, 25, "Christmas Day"),
  { month: 7, day: 3, name: "Day Before Independence Day", openWindows: [addWindows(9, 30, 13, 0)] },
  { month: 11, day: 28, name: "Black Friday", openWindows: [addWindows(9, 30, 13, 0)] },
  { month: 12, day: 24, name: "Christmas Eve", openWindows: [addWindows(9, 30, 13, 0)] },
];

const HOLIDAYS_2026: Holiday[] = [
  stocksFullDay(1, 1, "New Year's Day"),
  stocksFullDay(1, 19, "Martin Luther King Jr. Day"),
  stocksFullDay(2, 16, "Presidents' Day"),
  stocksFullDay(4, 3, "Good Friday"),
];

function getStocksHolidaysForYear(year: number): Holiday[] {
  if (year === 2025) return HOLIDAYS_2025;
  if (year === 2026) return HOLIDAYS_2026;
  return [];
}

export function getStocksHolidaysInWeek(currentDate: Date): Holiday[] {
  const dt = DateTime.fromJSDate(currentDate).setZone(ET);
  const weekStart = dt.startOf("week"); // Sunday 00:00 ET
  const weekEnd = weekStart.plus({ days: 7 }); // exclusive end
  const year = dt.year;
  const list = getStocksHolidaysForYear(year);

  return list.filter(h => {
    const d = DateTime.fromObject({ year, month: h.month, day: h.day }, { zone: ET });
    return d >= weekStart && d < weekEnd;
  });
}
