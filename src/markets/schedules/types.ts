import { IANAZone } from "luxon";

export type HM = { hour: number; minute: number };

export type Window = {
  start: HM; // ET
  end: HM; // ET
};

export type WeeklySchedule = {
  monday: Window[];
  tuesday: Window[];
  wednesday: Window[];
  thursday: Window[];
  friday: Window[];
  saturday: Window[];
  sunday: Window[];
};

// Monday = 1 ... Sunday = 7 (matches Luxon DateTime.weekday)
export enum WeekDay {
  Monday = 1,
  Tuesday = 2,
  Wednesday = 3,
  Thursday = 4,
  Friday = 5,
  Saturday = 6,
  Sunday = 7,
}

export type WeekDayKey = keyof WeeklySchedule;

export const weekDayToKey = (d: WeekDay): WeekDayKey => {
  switch (d) {
    case WeekDay.Monday:
      return "monday";
    case WeekDay.Tuesday:
      return "tuesday";
    case WeekDay.Wednesday:
      return "wednesday";
    case WeekDay.Thursday:
      return "thursday";
    case WeekDay.Friday:
      return "friday";
    case WeekDay.Saturday:
      return "saturday";
    case WeekDay.Sunday:
      return "sunday";
    default:
      return "sunday";
  }
};

export type Holiday = {
  month: number; // 1-12 (ET calendar)
  day: number; // 1-31 (ET calendar)
  name: string; // Holiday name
  openWindows: Window[]; // [] means full-day closed; otherwise overrides open windows for that date
};

export type Schedule = {
  holidays?: Holiday[];
  open: WeeklySchedule;
  lowLiq: WeeklySchedule;
  summary?: string;
};

export const ET_IANA = IANAZone.create("America/New_York");
