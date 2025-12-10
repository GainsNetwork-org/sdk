import { isOpenAt } from "./schedules";

export const isIndicesOpen = (dateToCheck: Date): boolean =>
  isOpenAt('indices', dateToCheck);
