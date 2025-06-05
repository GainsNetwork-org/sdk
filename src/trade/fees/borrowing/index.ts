import { OpenInterest, PairIndex } from "../../types";
import * as BorrowingFee from "./types";

export type GetBorrowingFeeContext = {
  currentBlock: number;
  groups: BorrowingFee.Group[];
  pairs: BorrowingFee.Pair[];
  collateralPriceUsd: number;
};

/**
 * @dev Calculates borrowing fees using v1 model (block-based with groups)
 * @dev Still actively used by markets that haven't migrated to v2
 * @dev Uses dynamic collateral OI - converts OI to USD for fee calculations
 * @param posDai Position size in collateral
 * @param pairIndex Trading pair index
 * @param long Whether position is long
 * @param initialAccFees Initial accumulated fees when trade was opened
 * @param context Context with current block, fee data, and collateral price
 * @returns Borrowing fee in collateral tokens
 */
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
            collateralPriceUsd: context.collateralPriceUsd,
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
    collateralPriceUsd: number;
  }
): {
  accFeeLong: number;
  accFeeShort: number;
  deltaLong: number;
  deltaShort: number;
} => {
  const {
    pairs,
    openInterest: { long, short },
    collateralPriceUsd,
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
    pair.feeExponent,
    pair.feePerBlockCap,
    collateralPriceUsd
  );
};

const getPairPendingAccFee = (
  pairIndex: PairIndex,
  currentBlock: number,
  long: boolean,
  context: {
    pairs: BorrowingFee.Pair[];
    openInterest: OpenInterest;
    collateralPriceUsd: number;
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
  context: { groups: BorrowingFee.Group[]; collateralPriceUsd: number }
): {
  accFeeLong: number;
  accFeeShort: number;
  deltaLong: number;
  deltaShort: number;
} => {
  const { groups, collateralPriceUsd } = context;
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
    group.feeExponent,
    undefined, // no fee caps for groups
    collateralPriceUsd
  );
};

const getGroupPendingAccFee = (
  groupIndex: number,
  currentBlock: number,
  long: boolean,
  context: { groups: BorrowingFee.Group[]; collateralPriceUsd: number }
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
    const { currentBlock, groups, pairs, collateralPriceUsd } = context;
    const openInterest = pairs[pairIndex].oi;
    deltaGroup = getGroupPendingAccFee(group.groupIndex, currentBlock, long, {
      groups,
      collateralPriceUsd,
    });
    deltaPair = getPairPendingAccFee(pairIndex, currentBlock, long, {
      pairs,
      openInterest,
      collateralPriceUsd,
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
  feeExponent: number,
  feeCaps?: BorrowingFee.BorrowingFeePerBlockCap, // as percentage: eg minP: 0.1 = 10%, maxP: 0.5 = 50%
  collateralPriceUsd?: number
): {
  accFeeLong: number;
  accFeeShort: number;
  deltaLong: number;
  deltaShort: number;
} => {
  const moreShorts = oiLong < oiShort;
  const blockDistance =
    currentBlock > accLastUpdatedBlock ? currentBlock - accLastUpdatedBlock : 0;

  // If block distance is zero nothing changes
  if (blockDistance === 0) {
    return {
      accFeeLong,
      accFeeShort,
      deltaLong: 0,
      deltaShort: 0,
    };
  }

  // Convert OI to USD if collateral price is provided (dynamic collateral OI)
  const oiLongUsd = collateralPriceUsd ? oiLong * collateralPriceUsd : oiLong;
  const oiShortUsd = collateralPriceUsd
    ? oiShort * collateralPriceUsd
    : oiShort;
  const maxOiUsd = collateralPriceUsd ? maxOi * collateralPriceUsd : maxOi;

  const netOi = Math.abs(oiLongUsd - oiShortUsd);

  // Calculate minimum and maximum effective oi (using USD values if available)
  const { minP, maxP } = getFeePerBlockCaps(feeCaps);
  const minNetOi = maxOiUsd * minP;
  const maxNetOi = maxOiUsd * maxP;

  // Calculate the minimum acc fee delta (applies to both sides)
  const minDelta =
    minNetOi > 0
      ? getPendingAccFeesDelta(
          blockDistance,
          feePerBlock,
          netOi,
          maxOiUsd,
          feeExponent
        )
      : 0;

  // Calculate the actual acc fee (using capped oi of 100% or less)
  const delta =
    netOi > minNetOi
      ? getPendingAccFeesDelta(
          blockDistance,
          feePerBlock,
          Math.min(netOi, maxNetOi), // if netOi > cap, use cap
          maxOiUsd,
          feeExponent
        )
      : minDelta;

  const [deltaLong, deltaShort] = moreShorts
    ? [minDelta, delta]
    : [delta, minDelta];

  return {
    accFeeLong: accFeeLong + deltaLong,
    accFeeShort: accFeeShort + deltaShort,
    deltaLong,
    deltaShort,
  };
};

const getPendingAccFeesDelta = (
  blockDistance: number,
  feePerBlock: number,
  netOi: number,
  maxOi: number,
  feeExponent: number
): number => {
  return maxOi > 0 && feeExponent > 0
    ? feePerBlock * blockDistance * (netOi / maxOi) ** feeExponent
    : 0;
};

const getFeePerBlockCaps = (
  cap?: BorrowingFee.BorrowingFeePerBlockCap
): BorrowingFee.BorrowingFeePerBlockCap => {
  return {
    minP: cap?.minP || 0,
    maxP: cap?.maxP && cap.maxP > 0 ? cap.maxP : 1,
  };
};

const getBorrowingDataActiveFeePerBlock = (
  val: BorrowingFee.Pair | BorrowingFee.Group
): number => {
  const { long, short, max } = val.oi;
  const { minP, maxP } = getFeePerBlockCaps(
    "feePerBlockCap" in val ? val.feePerBlockCap : undefined
  );

  // Calculate the effective open interest
  // If minP > 0 then netOi has to be at least minP * maxOi
  // If maxP > 0 then netOi cannot be more than maxP * maxOi
  const effectiveOi = Math.min(
    Math.max(Math.abs(long - short), max * minP),
    max * maxP
  );

  return val.feePerBlock * (effectiveOi / max) ** val.feeExponent;
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
  getPendingAccFeesDelta,
  getFeePerBlockCaps,
};

export * as BorrowingFee from "./types";
export * from "./converter";
