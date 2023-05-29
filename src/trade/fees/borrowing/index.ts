import { OpenInterest } from "../../types";
import * as BorrowingFee from "./types";

export type GetBorrowingFeeContext = {
  currentBlock: number;
  accBlockWeightedMarketCap: number;
  groups: BorrowingFee.Group[];
  pairs: BorrowingFee.Pair[];
  openInterest: OpenInterest;
};

export const getBorrowingFee = (
  posDai: number,
  pairIndex: number,
  long: boolean,
  initialAccFees: BorrowingFee.InitialAccFees,
  context: GetBorrowingFeeContext
): number => {
  if (
    !context.groups ||
    !context.pairs ||
    !context.openInterest ||
    !context.pairs[pairIndex]
  ) {
    return 0;
  }

  const { pairs } = context;
  const pairGroups = pairs[pairIndex].groups;
  const firstPairGroup = pairGroups?.length > 0 ? pairGroups[0] : undefined;

  let fee = 0;
  if (!firstPairGroup || firstPairGroup.block > initialAccFees.block) {
    fee =
      (!firstPairGroup
        ? getPairPendingAccFee(pairIndex, context.currentBlock, long, context)
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
  pairIndex: number,
  long: boolean,
  positionSizeDai: number,
  context: { groups: BorrowingFee.Group[]; pairs: BorrowingFee.Pair[] }
): boolean => {
  const { groups, pairs } = context;
  if (!groups || !pairs) {
    return false;
  }

  const g = groups[getPairGroupIndex(pairIndex, { pairs })];
  return (
    g.maxOi == 0 || (long ? g.oiLong : g.oiShort) + positionSizeDai <= g.maxOi
  );
};

const getPairGroupIndex = (
  pairIndex: number,
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
  pairIndex: number,
  currentBlock: number,
  context: {
    pairs: BorrowingFee.Pair[];
    openInterest: OpenInterest;
    accBlockWeightedMarketCap: number;
  }
): { accFeeLong: number; accFeeShort: number; delta: number } => {
  const {
    pairs,
    openInterest: { long, short },
    accBlockWeightedMarketCap,
  } = context;

  const pair = pairs[pairIndex];
  const vaultMarketCap = getWeightedVaultMarketCap(
    accBlockWeightedMarketCap,
    pair.lastAccBlockWeightedMarketCap,
    currentBlock - pair.accLastUpdatedBlock
  );
  return getPendingAccFees(
    pair.accFeeLong,
    pair.accFeeShort,
    long,
    short,
    pair.feePerBlock,
    currentBlock,
    pair.accLastUpdatedBlock,
    vaultMarketCap
  );
};

const getPairPendingAccFee = (
  pairIndex: number,
  currentBlock: number,
  long: boolean,
  context: {
    pairs: BorrowingFee.Pair[];
    openInterest: OpenInterest;
    accBlockWeightedMarketCap: number;
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
  context: { groups: BorrowingFee.Group[]; accBlockWeightedMarketCap: number }
): { accFeeLong: number; accFeeShort: number; delta: number } => {
  const { groups, accBlockWeightedMarketCap } = context;
  const group = groups[groupIndex];
  const vaultMarketCap = getWeightedVaultMarketCap(
    accBlockWeightedMarketCap,
    group.lastAccBlockWeightedMarketCap,
    currentBlock - group.accLastUpdatedBlock
  );
  return getPendingAccFees(
    group.accFeeLong,
    group.accFeeShort,
    group.oiLong,
    group.oiShort,
    group.feePerBlock,
    currentBlock,
    group.accLastUpdatedBlock,
    vaultMarketCap
  );
};

const getGroupPendingAccFee = (
  groupIndex: number,
  currentBlock: number,
  long: boolean,
  context: { groups: BorrowingFee.Group[]; accBlockWeightedMarketCap: number }
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
  pairIndex: number,
  long: boolean,
  context: GetBorrowingFeeContext
): { deltaGroup: number; deltaPair: number; beforeTradeOpen: boolean } => {
  const group = pairGroups[i];
  const beforeTradeOpen = group.block < initialFees.block;

  let deltaGroup, deltaPair;
  if (i == pairGroups.length - 1) {
    const {
      currentBlock,
      accBlockWeightedMarketCap,
      groups,
      pairs,
      openInterest,
    } = context;
    deltaGroup = getGroupPendingAccFee(group.groupIndex, currentBlock, long, {
      groups,
      accBlockWeightedMarketCap,
    });
    deltaPair = getPairPendingAccFee(pairIndex, currentBlock, long, {
      pairs,
      openInterest: openInterest,
      accBlockWeightedMarketCap,
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
  vaultMarketCap: number
): { accFeeLong: number; accFeeShort: number; delta: number } => {
  const delta =
    ((oiLong - oiShort) * feePerBlock * (currentBlock - accLastUpdatedBlock)) /
    vaultMarketCap;

  const newAccFeeLong = delta > 0 ? accFeeLong + delta : accFeeLong;
  const newAccFeeShort = delta < 0 ? accFeeShort - delta : accFeeShort;

  return { accFeeLong: newAccFeeLong, accFeeShort: newAccFeeShort, delta };
};

const getWeightedVaultMarketCap = (
  accBlockWeightedMarketCap: number,
  lastAccBlockWeightedMarketCap: number,
  blockDelta: number
): number => {
  return blockDelta > 0
    ? blockDelta /
        (accBlockWeightedMarketCap - lastAccBlockWeightedMarketCap) /
        1e18
    : 1;
};

const getActivePairFeePerBlock = (
  pair: BorrowingFee.Pair,
  openInterest: OpenInterest,
  accBlockWeightedMarketCap: number,
  currentBlock: number
): number => {
  const { long, short } = openInterest;
  const vaultMarketCap = getWeightedVaultMarketCap(
    accBlockWeightedMarketCap,
    pair.lastAccBlockWeightedMarketCap,
    currentBlock - pair.accLastUpdatedBlock
  );
  return (Math.abs(long - short) * pair.feePerBlock) / vaultMarketCap;
};

const getActiveGroupFeePerBlock = (
  group: BorrowingFee.Group,
  accBlockWeightedMarketCap: number,
  currentBlock: number
): number => {
  const { oiLong, oiShort } = group;
  const vaultMarketCap = getWeightedVaultMarketCap(
    accBlockWeightedMarketCap,
    group.lastAccBlockWeightedMarketCap,
    currentBlock - group.accLastUpdatedBlock
  );
  return (Math.abs(oiLong - oiShort) * group.feePerBlock) / vaultMarketCap;
};

const getActiveFeePerBlock = (
  pair: BorrowingFee.Pair,
  group: BorrowingFee.Group | undefined,
  pairOpenInterest: OpenInterest,
  accBlockWeightedMarketCap: number,
  currentBlock: number
): number => {
  const pairFeePerBlock = getActivePairFeePerBlock(
    pair,
    pairOpenInterest,
    accBlockWeightedMarketCap,
    currentBlock
  );

  if (!group) {
    return pairFeePerBlock;
  }

  const groupFeePerBlock = getActiveGroupFeePerBlock(
    group,
    accBlockWeightedMarketCap,
    currentBlock
  );

  return Math.max(pairFeePerBlock, groupFeePerBlock);
};

export const borrowingFeeUtils = {
  getPairGroupAccFeesDeltas,
  getPairPendingAccFees,
  getPairPendingAccFee,
  getGroupPendingAccFees,
  getGroupPendingAccFee,
  getPendingAccFees,
  getActivePairFeePerBlock,
  getActiveGroupFeePerBlock,
  getActiveFeePerBlock,
  getWeightedVaultMarketCap,
  getPairGroupIndex,
};

export * as BorrowingFee from "./types";
