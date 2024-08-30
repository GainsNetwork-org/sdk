import { OpenInterest, PairIndex } from "../../types";
import * as BorrowingFee from "./types";

export type GetBorrowingFeeContext = {
  currentBlock: number;
  groups: BorrowingFee.Group[];
  pairs: BorrowingFee.Pair[];
};

export const getBorrowingFee = (
  posDai: number,
  pairIndex: PairIndex,
  long: boolean,
  initialAccFees: BorrowingFee.InitialAccFees,
  context: GetBorrowingFeeContext
): number => {
  if (!context.groups || !context.pairs || !context.pairs[pairIndex]) {
    return 0;
  }

  const { pairs } = context;
  const pairGroups = pairs[pairIndex].groups;
  const firstPairGroup = pairGroups?.length > 0 ? pairGroups[0] : undefined;

  let fee = 0;
  if (!firstPairGroup || firstPairGroup.block > initialAccFees.block) {
    const openInterest = pairs[pairIndex].oi;
    fee =
      (!firstPairGroup
        ? getPairPendingAccFee(pairIndex, context.currentBlock, long, {
            pairs,
            openInterest,
          })
        : long
        ? firstPairGroup.pairAccFeeLong
        : firstPairGroup.pairAccFeeShort) - initialAccFees.accPairFee;
  }

  for (let i = pairGroups.length; i > 0; i--) {
    const { deltaGroup, deltaPair, beforeTradeOpen } =
      getPairGroupAccFeesDeltas(
        i - 1,
        pairGroups,
        initialAccFees,
        pairIndex,
        long,
        context
      );

    fee += Math.max(deltaGroup, deltaPair);

    if (beforeTradeOpen) {
      break;
    }
  }

  return (posDai * fee) / 100;
};

export const withinMaxGroupOi = (
  pairIndex: PairIndex,
  long: boolean,
  positionSizeCollateral: number,
  context: { groups: BorrowingFee.Group[]; pairs: BorrowingFee.Pair[] }
): boolean => {
  const { groups, pairs } = context;
  if (!groups || !pairs) {
    return false;
  }

  const g = groups[getPairGroupIndex(pairIndex, { pairs })].oi;
  return (
    g.max == 0 || (long ? g.long : g.short) + positionSizeCollateral <= g.max
  );
};

const getPairGroupIndex = (
  pairIndex: PairIndex,
  context: { pairs: BorrowingFee.Pair[] }
): number => {
  const { pairs } = context;
  if (!pairs[pairIndex]) {
    return 0;
  }

  const pairGroups = pairs[pairIndex].groups;
  return pairGroups.length == 0 ? 0 : pairGroups[0].groupIndex;
};

const getPairPendingAccFees = (
  pairIndex: PairIndex,
  currentBlock: number,
  context: {
    pairs: BorrowingFee.Pair[];
    openInterest: OpenInterest;
  }
): { accFeeLong: number; accFeeShort: number; delta: number } => {
  const {
    pairs,
    openInterest: { long, short },
  } = context;

  const pair = pairs[pairIndex];

  return getPendingAccFees(
    pair.accFeeLong,
    pair.accFeeShort,
    long,
    short,
    pair.feePerBlock,
    currentBlock,
    pair.accLastUpdatedBlock,
    pair.oi.max,
    pair.feeExponent
  );
};

const getPairPendingAccFee = (
  pairIndex: PairIndex,
  currentBlock: number,
  long: boolean,
  context: {
    pairs: BorrowingFee.Pair[];
    openInterest: OpenInterest;
  }
): number => {
  const { accFeeLong, accFeeShort } = getPairPendingAccFees(
    pairIndex,
    currentBlock,
    context
  );
  return long ? accFeeLong : accFeeShort;
};

const getGroupPendingAccFees = (
  groupIndex: number,
  currentBlock: number,
  context: { groups: BorrowingFee.Group[] }
): { accFeeLong: number; accFeeShort: number; delta: number } => {
  const { groups } = context;
  const group = groups[groupIndex];
  return getPendingAccFees(
    group.accFeeLong,
    group.accFeeShort,
    group.oi.long,
    group.oi.short,
    group.feePerBlock,
    currentBlock,
    group.accLastUpdatedBlock,
    group.oi.max,
    group.feeExponent
  );
};

const getGroupPendingAccFee = (
  groupIndex: number,
  currentBlock: number,
  long: boolean,
  context: { groups: BorrowingFee.Group[] }
): number => {
  const { accFeeLong, accFeeShort } = getGroupPendingAccFees(
    groupIndex,
    currentBlock,
    context
  );
  return long ? accFeeLong : accFeeShort;
};

const getPairGroupAccFeesDeltas = (
  i: number,
  pairGroups: BorrowingFee.PairGroup[],
  initialFees: BorrowingFee.InitialAccFees,
  pairIndex: PairIndex,
  long: boolean,
  context: GetBorrowingFeeContext
): { deltaGroup: number; deltaPair: number; beforeTradeOpen: boolean } => {
  const group = pairGroups[i];
  const beforeTradeOpen = group.block < initialFees.block;

  let deltaGroup, deltaPair;
  if (i == pairGroups.length - 1) {
    const { currentBlock, groups, pairs } = context;
    const openInterest = pairs[pairIndex].oi;
    deltaGroup = getGroupPendingAccFee(group.groupIndex, currentBlock, long, {
      groups,
    });
    deltaPair = getPairPendingAccFee(pairIndex, currentBlock, long, {
      pairs,
      openInterest,
    });
  } else {
    const nextGroup = pairGroups[i + 1];
    if (beforeTradeOpen && nextGroup.block <= initialFees.block) {
      return { deltaGroup: 0, deltaPair: 0, beforeTradeOpen };
    }

    deltaGroup = long
      ? nextGroup.prevGroupAccFeeLong
      : nextGroup.prevGroupAccFeeShort;
    deltaPair = long ? nextGroup.pairAccFeeLong : nextGroup.pairAccFeeShort;
  }

  if (beforeTradeOpen) {
    deltaGroup -= initialFees.accGroupFee;
    deltaPair -= initialFees.accPairFee;
  } else {
    deltaGroup -= long ? group.initialAccFeeLong : group.initialAccFeeShort;
    deltaPair -= long ? group.pairAccFeeLong : group.pairAccFeeShort;
  }

  return { deltaGroup, deltaPair, beforeTradeOpen };
};

const getPendingAccFees = (
  accFeeLong: number,
  accFeeShort: number,
  oiLong: number,
  oiShort: number,
  feePerBlock: number,
  currentBlock: number,
  accLastUpdatedBlock: number,
  maxOi: number,
  feeExponent: number
): { accFeeLong: number; accFeeShort: number; delta: number } => {
  const moreShorts = oiLong < oiShort;
  const netOi = Math.abs(oiLong - oiShort);
  const delta =
    maxOi > 0 && feeExponent > 0
      ? feePerBlock *
        (currentBlock - accLastUpdatedBlock) *
        (netOi / maxOi) ** feeExponent
      : 0;

  const newAccFeeLong = moreShorts ? accFeeLong : accFeeLong + delta;
  const newAccFeeShort = moreShorts ? accFeeShort + delta : accFeeShort;

  return { accFeeLong: newAccFeeLong, accFeeShort: newAccFeeShort, delta };
};

const getBorrowingDataActiveFeePerBlock = (
  val: BorrowingFee.Pair | BorrowingFee.Group
): number => {
  const { long, short, max } = val.oi;
  const netOi = Math.abs(long - short);

  return val.feePerBlock * (netOi / max) ** val.feeExponent;
};

const getActiveFeePerBlock = (
  pair: BorrowingFee.Pair,
  group: BorrowingFee.Group | undefined
): number => {
  const pairFeePerBlock = getBorrowingDataActiveFeePerBlock(pair);

  if (!group) {
    return pairFeePerBlock;
  }

  const groupFeePerBlock = getBorrowingDataActiveFeePerBlock(group);

  return Math.max(pairFeePerBlock, groupFeePerBlock);
};

export const borrowingFeeUtils = {
  getPairGroupAccFeesDeltas,
  getPairPendingAccFees,
  getPairPendingAccFee,
  getGroupPendingAccFees,
  getGroupPendingAccFee,
  getPendingAccFees,
  getActiveFeePerBlock,
  getBorrowingDataActiveFeePerBlock,
  getPairGroupIndex,
};

export * as BorrowingFee from "./types";
export * from "./converter";
