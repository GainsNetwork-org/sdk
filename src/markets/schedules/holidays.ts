import { DateTime, IANAZone } from "luxon";
import { Holiday } from "./types";
import { TradFiMarket } from "./index";

const ET = IANAZone.create("America/New_York");

const full = (year: number, month: number, day: number, name: string): Holiday =>
  ({ year, month, day, name, openWindows: [] });

const partial = (year: number, month: number, day: number, name: string, startH: number, startM: number, endH: number, endM: number): Holiday =>
  ({ year, month, day, name, openWindows: [{ start: { hour: startH, minute: startM }, end: { hour: endH, minute: endM } }] });

// Shared holidays
const HOLIDAYS: Holiday[] = [
  // 2025
  full(2025, 5, 26, "Memorial Day"),
  full(2025, 6, 19, "Juneteenth"),
  partial(2025, 7, 3, "Day Before Independence Day", 9, 30, 13, 0),
  full(2025, 7, 4, "Independence Day"),
  full(2025, 9, 1, "Labor Day"),
  full(2025, 11, 27, "Thanksgiving Day"),
  partial(2025, 11, 28, "Black Friday", 9, 30, 13, 0),
  full(2025, 12, 25, "Christmas Day"),

  // 2026
  full(2026, 1, 1, "New Year's Day"),
  full(2026, 1, 19, "Martin Luther King Jr. Day"),
  full(2026, 4, 3, "Good Friday"),
];

// Market-specific holiday overrides
const HOLIDAYS_OVERRIDES: Record<TradFiMarket, Holiday[]> = {
  stocks: [
    partial(2025, 12, 24, "Christmas Eve", 9, 30, 13, 0),
    full(2026, 2, 16, "Presidents' Day"),
  ],
  indices: [
    partial(2025, 12, 24, "Christmas Eve", 9, 30, 12, 15),
    partial(2025, 12, 31, "New Year's Eve", 0, 0, 16, 0),    
    full(2026, 2, 16, "Presidents' Day"),
  ],
  commodities: [
    // MLK Jr. Day: Open until 1 PM ET, closed from 1-6 PM ET, then reopens at 6 PM ET
    { 
      year: 2026, 
      month: 1, 
      day: 19, 
      name: "Martin Luther King Jr. Day", 
      openWindows: [
        { start: { hour: 0, minute: 0 }, end: { hour: 13, minute: 0 } },
        { start: { hour: 18, minute: 0 }, end: { hour: 24, minute: 0 } }
      ] 
    },
    partial(2025, 12, 24, "Christmas Eve", 0, 0, 12, 45),
    partial(2025, 12, 31, "New Year's Eve", 0, 0, 16, 0),
    partial(2026, 2, 16, "Presidents' Day", 0, 0, 14, 30) // Presidents day, early close 2:30 ET
  ],
  forex: [
    partial(2025, 12, 24, "Christmas Eve", 0, 0, 12, 45),
    partial(2025, 12, 31, "New Year's Eve", 0, 0, 16, 0),
  ],
};

const getHolidaysForYear = (market: TradFiMarket, year: number): Holiday[] => {
  const holidayOverrides = HOLIDAYS_OVERRIDES[market]?.filter(h => h.year === year) || [];
  const overridden = new Set(holidayOverrides.map(h => h.name));
  const filteredHolidays = HOLIDAYS.filter(h => h.year === year && !overridden.has(h.name));

  return [...filteredHolidays, ...holidayOverrides].sort((a, b) =>
    a.month === b.month ? a.day - b.day : a.month - b.month
  );
}

export const getHolidays = (
  market: TradFiMarket,
  startDate: Date,
  days: number
): Holiday[] => {
  const start = DateTime.fromJSDate(startDate).setZone(ET).startOf('day');
  const end = start.plus({ days });

  const years = [];
  for (let year = start.year; year <= end.year; year++) {
    years.push(year);
  }

  return years.flatMap(year =>
    getHolidaysForYear(market, year).filter(h => {
      const d = DateTime.fromObject(
        { year: h.year, month: h.month, day: h.day },
        { zone: ET }
      );
      return d >= start && d < end;
    })
  );
}

export const getHolidaysInCurrentWeek = (
  market: TradFiMarket,
  currentDate: Date
): Holiday[] => {
  const weekStart = DateTime.fromJSDate(currentDate).setZone(ET).startOf("week");
  return getHolidays(market, weekStart.toJSDate(), 7);
}

