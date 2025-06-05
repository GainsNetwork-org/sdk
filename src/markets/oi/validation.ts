/**
 * @dev OI Validation module
 * @dev Provides validation functions for Open Interest limits
 */

import { UnifiedPairOi } from "./types";
import { computeOiValues } from "./converter";
import * as BorrowingFee from "../../trade/fees/borrowing/types";
import { PairIndex } from "../../trade/types";

/**
 * @dev Check if a position would exceed per-pair OI limits
 * @param pairOi Current OI data for the pair
 * @param long Whether the position is long
 * @param positionSizeCollateral Position size in collateral
 * @param currentPrice Current collateral price in USD (required for dynamic OI)
 * @returns true if within limits, false if would exceed
 */
export const withinMaxPairOi = (
  pairOi: UnifiedPairOi,
  long: boolean,
  positionSizeCollateral: number,
  currentPrice: number
): boolean => {
  // If maxCollateral is 0, unlimited OI allowed
  if (pairOi.maxCollateral === 0) {
    return true;
  }

  // Calculate current dynamic OI
  const computed = computeOiValues(pairOi, currentPrice);
  const currentOi = long
    ? computed.totalDynamicCollateral.long
    : computed.totalDynamicCollateral.short;

  // Check if adding position would exceed max
  const newOi = currentOi + positionSizeCollateral;
  return newOi <= pairOi.maxCollateral;
};

/**
 * @dev Calculate dynamic OI for a specific side
 * @param pairOi OI data for the pair
 * @param currentPrice Current collateral price in USD
 * @param long Whether to calculate for long side
 * @returns Dynamic OI in collateral value
 */
export const calculateDynamicOi = (
  pairOi: UnifiedPairOi,
  currentPrice: number,
  long: boolean
): number => {
  const computed = computeOiValues(pairOi, currentPrice);
  return long
    ? computed.totalDynamicCollateral.long
    : computed.totalDynamicCollateral.short;
};

/**
 * @dev Calculate remaining OI capacity for a side
 * @param pairOi OI data for the pair
 * @param currentPrice Current collateral price in USD
 * @param long Whether to calculate for long side
 * @returns Remaining capacity in collateral (0 if unlimited)
 */
export const getRemainingOiCapacity = (
  pairOi: UnifiedPairOi,
  currentPrice: number,
  long: boolean
): number => {
  // If maxCollateral is 0, unlimited capacity
  if (pairOi.maxCollateral === 0) {
    return 0; // Indicates unlimited
  }

  const dynamicOi = calculateDynamicOi(pairOi, currentPrice, long);
  const remaining = pairOi.maxCollateral - dynamicOi;

  // Return 0 if already at or over capacity
  return Math.max(0, remaining);
};

/**
 * @dev Updated group OI validation using dynamic OI
 * @param pairIndex Index of the trading pair
 * @param long Whether the position is long
 * @param positionSizeCollateral Position size in collateral
 * @param currentPrice Current collateral price in USD
 * @param context Context with groups, pairs, and OI data
 * @returns true if within group limits, false if would exceed
 */
export const withinMaxGroupOiDynamic = (
  pairIndex: PairIndex,
  long: boolean,
  positionSizeCollateral: number,
  currentPrice: number,
  context: {
    groups: BorrowingFee.Group[];
    pairs: BorrowingFee.Pair[];
    pairOis: UnifiedPairOi[];
  }
): boolean => {
  const pair = context.pairs[pairIndex];
  if (!pair) return false;

  // Get group index from first group in pair's groups array
  const groupIndex = pair.groups.length > 0 ? pair.groups[0].groupIndex : 0;
  const group = context.groups[groupIndex];
  if (!group) return false;

  // If maxOi is 0, unlimited OI allowed
  if (group.oi.max === 0) {
    return true;
  }

  // Calculate total dynamic OI for all pairs in group
  let totalGroupOi = 0;

  context.pairs.forEach((p, idx) => {
    const pGroupIndex = p.groups.length > 0 ? p.groups[0].groupIndex : 0;
    if (pGroupIndex === groupIndex && context.pairOis[idx]) {
      const pairOi = context.pairOis[idx];
      const computed = computeOiValues(pairOi, currentPrice);

      // Add both long and short OI for the pair
      totalGroupOi +=
        computed.totalDynamicCollateral.long +
        computed.totalDynamicCollateral.short;
    }
  });

  // Check if adding position would exceed group max
  const newTotalOi = totalGroupOi + positionSizeCollateral;
  return newTotalOi <= group.oi.max;
};

/**
 * @dev Calculate total dynamic OI for a group
 * @param groupIndex Index of the group
 * @param currentPrice Current collateral price in USD
 * @param context Context with pairs and OI data
 * @returns Total dynamic OI for the group
 */
export const getGroupDynamicOi = (
  groupIndex: number,
  currentPrice: number,
  context: {
    pairs: BorrowingFee.Pair[];
    pairOis: UnifiedPairOi[];
  }
): { long: number; short: number; total: number } => {
  let longOi = 0;
  let shortOi = 0;

  context.pairs.forEach((p, idx) => {
    const pGroupIndex = p.groups.length > 0 ? p.groups[0].groupIndex : 0;
    if (pGroupIndex === groupIndex && context.pairOis[idx]) {
      const pairOi = context.pairOis[idx];
      const computed = computeOiValues(pairOi, currentPrice);

      longOi += computed.totalDynamicCollateral.long;
      shortOi += computed.totalDynamicCollateral.short;
    }
  });

  return {
    long: longOi,
    short: shortOi,
    total: longOi + shortOi,
  };
};

/**
 * @dev Check both pair and group OI limits
 * @param pairIndex Index of the trading pair
 * @param long Whether the position is long
 * @param positionSizeCollateral Position size in collateral
 * @param currentPrice Current collateral price in USD
 * @param context Full context with all required data
 * @returns Object with validation results
 */
export const validateOiLimits = (
  pairIndex: PairIndex,
  long: boolean,
  positionSizeCollateral: number,
  currentPrice: number,
  context: {
    groups: BorrowingFee.Group[];
    pairs: BorrowingFee.Pair[];
    pairOis: UnifiedPairOi[];
  }
): {
  withinPairLimit: boolean;
  withinGroupLimit: boolean;
  pairRemainingCapacity: number;
  groupRemainingCapacity: number;
} => {
  const pairOi = context.pairOis[pairIndex];
  if (!pairOi) {
    return {
      withinPairLimit: false,
      withinGroupLimit: false,
      pairRemainingCapacity: 0,
      groupRemainingCapacity: 0,
    };
  }

  // Check pair limits
  const withinPairLimit = withinMaxPairOi(
    pairOi,
    long,
    positionSizeCollateral,
    currentPrice
  );
  const pairRemainingCapacity = getRemainingOiCapacity(
    pairOi,
    currentPrice,
    long
  );

  // Check group limits
  const withinGroupLimit = withinMaxGroupOiDynamic(
    pairIndex,
    long,
    positionSizeCollateral,
    currentPrice,
    context
  );

  // Calculate group remaining capacity
  const pair = context.pairs[pairIndex];
  let groupRemainingCapacity = 0;

  if (pair) {
    const groupIndex = pair.groups.length > 0 ? pair.groups[0].groupIndex : 0;
    const group = context.groups[groupIndex];
    if (group && group.oi.max > 0) {
      const groupOi = getGroupDynamicOi(groupIndex, currentPrice, context);
      groupRemainingCapacity = Math.max(0, group.oi.max - groupOi.total);
    }
  }

  return {
    withinPairLimit,
    withinGroupLimit,
    pairRemainingCapacity,
    groupRemainingCapacity,
  };
};
