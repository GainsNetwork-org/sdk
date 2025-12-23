import { DateTime, IANAZone } from 'luxon';
import { Schedule, WeeklySchedule, Window, WeekDay, weekDayToKey } from './types';
import { getHolidaysInCurrentWeek } from './holidays';

const ET = IANAZone.create('America/New_York');

const emptyWeekly = (): WeeklySchedule => ({
  monday: [],
  tuesday: [],
  wednesday: [],
  thursday: [],
  friday: [],
  saturday: [],
  sunday: [],
});

const add = (ws: WeeklySchedule, day: WeekDay, win: Window) => {
  ws[weekDayToKey(day)].push(win);
};

export const buildForexWeeklySchedule = (currentDate: Date = new Date(), opts?: { pairGroupIndex?: number }): Schedule => {
  const dt = DateTime.fromJSDate(currentDate).setZone(ET);
  const isInDST = dt.isInDST;
  const open = emptyWeekly();
  const lowLiq = emptyWeekly();

  const openHour = isInDST ? 16 : 17; // Monday open
  const closeHour = isInDST ? 16 : 17; // Friday close

  // Open windows (ET): Sun 16/17:00 -> 24:00, Mon-Thu 0-24, Fri 0 -> 16/17:00
  add(open, WeekDay.Sunday, { start: { hour: openHour, minute: 0 }, end: { hour: 24, minute: 0 } });
  add(open, WeekDay.Monday, { start: { hour: 0, minute: 0 }, end: { hour: 24, minute: 0 } });
  add(open, WeekDay.Tuesday, { start: { hour: 0, minute: 0 }, end: { hour: 24, minute: 0 } });
  add(open, WeekDay.Wednesday, { start: { hour: 0, minute: 0 }, end: { hour: 24, minute: 0 } });
  add(open, WeekDay.Thursday, { start: { hour: 0, minute: 0 }, end: { hour: 24, minute: 0 } });
  add(open, WeekDay.Friday, { start: { hour: 0, minute: 0 }, end: { hour: closeHour, minute: 0 } });

  // Low-liquidity windows (ET)
  const extendedGroups = [8, 9];
  const useExtended = opts?.pairGroupIndex !== undefined && extendedGroups.includes(+opts.pairGroupIndex);
  const llStartHour = isInDST ? (useExtended ? 14 : 15) : (useExtended ? 15 : 16);
  const llStartMinute = 45;
  const llEndHour = isInDST ? (useExtended ? 21 : 19) : (useExtended ? 22 : 20);
  const llEndMinute = 0;
  for (const d of [WeekDay.Sunday,WeekDay.Monday, WeekDay.Tuesday, WeekDay.Wednesday, WeekDay.Thursday, WeekDay.Friday]) {
    add(lowLiq, d, { start: { hour: llStartHour, minute: llStartMinute }, end: { hour: llEndHour, minute: llEndMinute } });
  }

  const holidays = getHolidaysInCurrentWeek('forex', currentDate);
  const summary = isInDST
    ? 'Sunday 4:00 pm - Friday 4:00 pm ET (Closed weekends & holidays)'
    : 'Sunday 5:00 pm - Friday 5:00 pm ET (Closed weekends & holidays)';

  return { open, lowLiq, holidays, summary };
};

export const buildStocksWeeklySchedule = (currentDate: Date = new Date()): Schedule => {
  const open = emptyWeekly();
  const lowLiq = emptyWeekly();
  for (const d of [WeekDay.Monday, WeekDay.Tuesday, WeekDay.Wednesday, WeekDay.Thursday, WeekDay.Friday] as const) {
    add(open, d, { start: { hour: 9, minute: 30 }, end: { hour: 16, minute: 0 } });
  }
  const holidays = getHolidaysInCurrentWeek('stocks', currentDate);
  const summary = 'Monday - Friday: 9:30 am - 4:00 pm ET (Closed weekends & holidays)';
  return { open, lowLiq, holidays, summary };
};

export const buildIndicesWeeklySchedule = (currentDate: Date = new Date()): Schedule => buildStocksWeeklySchedule(currentDate);

export const buildCommoditiesWeeklySchedule = (currentDate: Date = new Date()): Schedule => {
  const open = emptyWeekly();
  const lowLiq = emptyWeekly();

  // Sunday: 18:00 -> 24:00
  add(open, WeekDay.Sunday, { start: { hour: 18, minute: 0 }, end: { hour: 24, minute: 0 } });
  // Mon-Thu: 0:00 -> 17:00 and 18:00 -> 24:00 (break represented by the gap)
  for (const d of [WeekDay.Monday, WeekDay.Tuesday, WeekDay.Wednesday, WeekDay.Thursday]) {
    add(open, d, { start: { hour: 0, minute: 0 }, end: { hour: 17, minute: 0 } });
    add(open, d, { start: { hour: 18, minute: 0 }, end: { hour: 24, minute: 0 } });
  }
  // Friday: 0:00 -> 17:00
  add(open, WeekDay.Friday, { start: { hour: 0, minute: 0 }, end: { hour: 17, minute: 0 } });
  // Saturday: closed (no windows)

  const holidays = getHolidaysInCurrentWeek('commodities', currentDate);
  const summary = `Sunday 6:00 pm - Friday 5:00 pm ET (Daily break: 5:00 pm - 6:00 pm ET)`;
  return { open, lowLiq, holidays, summary };
};
