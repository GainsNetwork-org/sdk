/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// @ts-ignore-file
import { Pair } from "src/trade";
import { isOpenAt, isLowLiquidityAt } from "./schedules";

export const isForexOpen = (dateToCheck: Date): boolean =>
  isOpenAt('forex', dateToCheck);

export const isForexLowLiquidity = (timestampToCheck: number, pair?: Pair) =>
  isLowLiquidityAt('forex', new Date(timestampToCheck),
    pair?.groupIndex !== undefined ? { pairGroupIndex: +pair!.groupIndex } : undefined
  );
