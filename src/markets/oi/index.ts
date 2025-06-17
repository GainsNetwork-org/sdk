/**
 * @dev Main export file for OI module
 * @dev Provides unified Open Interest management functionality
 */

import { GenericPairOiContext } from "./types";

export const getPairTotalOisCollateral = (
  pairIndex: number,
  context: GenericPairOiContext
): { long: number; short: number } => {
  return {
    long:
      context.pairOis[pairIndex].beforeV10Collateral.long +
      context.pairOis[pairIndex].collateral.long,
    short:
      context.pairOis[pairIndex].beforeV10Collateral.short +
      context.pairOis[pairIndex].collateral.short,
  };
};

/**
 * @dev Returns pair total dynamic open interest (before v10 + after v10) in collateral tokens
 * @param pairIndex index of pair
 * @param context contains UnifiedPairOi array and current pair price
 * @returns dynamic OI for long and short sides in collateral precision
 */
export const getPairTotalOisDynamicCollateral = (
  pairIndex: number,
  context: GenericPairOiContext & { currentPairPrice: number }
): { long: number; short: number } => {
  const pairOi = context.pairOis[pairIndex];

  // We have to use the initial collateral OIs for pre-v10 trades because we don't have OIs in token amount
  const oiLongCollateralDynamicAfterV10 =
    pairOi.beforeV10Collateral.long +
    pairOi.token.long * context.currentPairPrice;

  const oiShortCollateralDynamicAfterV10 =
    pairOi.beforeV10Collateral.short +
    pairOi.token.short * context.currentPairPrice;

  return {
    long: oiLongCollateralDynamicAfterV10,
    short: oiShortCollateralDynamicAfterV10,
  };
};

/**
 * @dev Returns pair total dynamic open interest (before v10 + after v10) in collateral tokens on one side only
 * @param pairIndex index of pair
 * @param long true if long, false if short
 * @param context contains UnifiedPairOi array and current pair price
 * @returns dynamic OI for the specified side in collateral precision
 */
export const getPairTotalOiDynamicCollateral = (
  pairIndex: number,
  long: boolean,
  context: GenericPairOiContext & { currentPairPrice: number }
): number => {
  const dynamicOis = getPairTotalOisDynamicCollateral(pairIndex, context);
  return long ? dynamicOis.long : dynamicOis.short;
};

/**
 * @dev Returns pair open interest skew (v10 only) in tokens
 * @param pairIndex index of pair
 * @param context contains UnifiedPairOi array
 * @returns skew in token amount (positive = more longs, negative = more shorts)
 */
export const getPairV10OiTokenSkewCollateral = (
  pairIndex: number,
  context: GenericPairOiContext
): number => {
  const pairOi = context.pairOis[pairIndex];
  return pairOi.token.long - pairOi.token.short;
};

/**
 * @dev Returns pair dynamic skew (v10 only) in collateral tokens
 * @param pairIndex index of pair
 * @param context contains UnifiedPairOi array and current pair price
 * @returns dynamic skew in collateral precision
 */
export const getPairV10OiDynamicSkewCollateral = (
  pairIndex: number,
  context: GenericPairOiContext & { currentPairPrice: number }
): number => {
  return (
    getPairV10OiTokenSkewCollateral(pairIndex, context) *
    context.currentPairPrice
  );
};

// Types
export { UnifiedPairOi, GroupOi, ComputedOi } from "./types";

// Converters
export {
  convertBeforeV10Collateral,
  convertCollateralOi,
  convertTokenOi,
  convertPairOi,
  convertPairOiArray,
  computeOiValues,
} from "./converter";
