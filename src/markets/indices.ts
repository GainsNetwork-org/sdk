import { isStocksOpen } from "./stocks";

export const isIndicesOpen = (dateToCheck: Date): boolean =>
  isStocksOpen(dateToCheck);
