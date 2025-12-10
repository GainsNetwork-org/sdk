// @ts-ignore-file
import { isOpenAt } from "./schedules";

export const isCommoditiesOpen = (dateToCheck: Date): boolean =>
  isOpenAt('commodities', dateToCheck);
