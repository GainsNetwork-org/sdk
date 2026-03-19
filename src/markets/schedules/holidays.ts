import { DateTime, IANAZone } from "luxon";
import { Holiday } from "./types";
import { TradFiMarket } from "./index";

const ET = IANAZone.create("America/New_York");

const full = (
  year: number,
  month: number,
  day: number,
  name: string
): Holiday => ({ year, month, day, name, openWindows: [] });

const partial = (
  year: number,
  month: number,
  day: number,
  name: string,
  startH: number,
  startM: number,
  endH: number,
  endM: number
): Holiday => ({
  year,
  month,
  day,
  name,
  openWindows: [
    {
      start: { hour: startH, minute: startM },
      end: { hour: endH, minute: endM },
    },
  ],
});

// Shared holidays
const HOLIDAYS: Holiday[] = [
  full(2026, 4, 3, "Good Friday"),
  full(2026, 5, 25, "Memorial Day"),
  full(2026, 6, 19, "Juneteenth"),
  partial(2026, 7, 2, "Day Before Independence Day", 9, 30, 13, 0),
  full(2026, 7, 3, "Independence Day"),
  full(2026, 9, 7, "Labor Day"),
  full(2026, 11, 26, "Thanksgiving Day"),
  partial(2026, 11, 27, "Black Friday", 9, 30, 13, 0),
  full(2026, 12, 25, "Christmas Day"),

  // 2027
  full(2027, 1, 1, "New Year's Day"),
  full(2027, 1, 18, "Martin Luther King Jr. Day"),
  full(2027, 3, 26, "Good Friday"),
  full(2027, 5, 31, "Memorial Day"),
  full(2027, 6, 18, "Juneteenth"),
  full(2027, 7, 5, "Independence Day"),
  full(2027, 9, 6, "Labor Day"),
  full(2027, 11, 25, "Thanksgiving Day"),
  partial(2027, 11, 26, "Black Friday", 9, 30, 13, 0),
  full(2027, 12, 24, "Christmas Day"),
];

// Market-specific holiday overrides
const HOLIDAYS_OVERRIDES: Record<TradFiMarket, Holiday[]> = {
  stocks: [
    // 2026
    partial(2026, 12, 24, "Christmas Eve", 9, 30, 13, 0),
    // 2027
    full(2027, 2, 15, "Presidents' Day"),
  ],
  indices: [
    // 2026
    partial(2026, 12, 24, "Christmas Eve", 9, 30, 12, 15),
    partial(2026, 12, 31, "New Year's Eve", 0, 0, 16, 0),
    // 2027
    full(2027, 2, 15, "Presidents' Day"),
    partial(2027, 12, 31, "New Year's Eve", 0, 0, 16, 0),
  ],
  commodities: [
    // 2026
    partial(2026, 12, 24, "Christmas Eve", 0, 0, 12, 45),
    partial(2026, 12, 31, "New Year's Eve", 0, 0, 16, 0),
    // 2027
    // MLK Jr. Day: Open until 1 PM ET, closed 1-6 PM, reopens 6 PM
    {
      year: 2027,
      month: 1,
      day: 18,
      name: "Martin Luther King Jr. Day",
      openWindows: [
        { start: { hour: 0, minute: 0 }, end: { hour: 13, minute: 0 } },
        { start: { hour: 18, minute: 0 }, end: { hour: 24, minute: 0 } },
      ],
    },
    // Presidents' Day: Open until 2:30 PM ET, closed 2:30-6 PM, reopens 6 PM
    {
      year: 2027,
      month: 2,
      day: 15,
      name: "Presidents' Day",
      openWindows: [
        { start: { hour: 0, minute: 0 }, end: { hour: 14, minute: 30 } },
        { start: { hour: 18, minute: 0 }, end: { hour: 24, minute: 0 } },
      ],
    },
    partial(2027, 12, 31, "New Year's Eve", 0, 0, 16, 0),
  ],
  forex: [
    // 2026
    partial(2026, 12, 24, "Christmas Eve", 0, 0, 12, 45),
    partial(2026, 12, 31, "New Year's Eve", 0, 0, 16, 0),
    // 2027
    partial(2027, 12, 31, "New Year's Eve", 0, 0, 16, 0),
  ],
};

const getHolidaysForYear = (market: TradFiMarket, year: number): Holiday[] => {
  const holidayOverrides =
    HOLIDAYS_OVERRIDES[market]?.filter(h => h.year === year) || [];
  const overridden = new Set(holidayOverrides.map(h => h.name));
  const filteredHolidays = HOLIDAYS.filter(
    h => h.year === year && !overridden.has(h.name)
  );

  return [...filteredHolidays, ...holidayOverrides].sort((a, b) =>
    a.month === b.month ? a.day - b.day : a.month - b.month
  );
};

export const getHolidays = (
  market: TradFiMarket,
  startDate: Date,
  days: number
): Holiday[] => {
  const start = DateTime.fromJSDate(startDate).setZone(ET).startOf("day");
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
};

export const getHolidaysInCurrentWeek = (
  market: TradFiMarket,
  currentDate: Date
): Holiday[] => {
  const weekStart = DateTime.fromJSDate(currentDate)
    .setZone(ET)
    .startOf("week");
  return getHolidays(market, weekStart.toJSDate(), 7);
};
