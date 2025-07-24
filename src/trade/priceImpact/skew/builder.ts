/**
 * @dev Builders for skew price impact contexts
 */

import { TradingVariablesCollateral } from "../../../backend/tradingVariables/types";
import { SkewPriceImpactContext } from "./types";

/**
 * @dev Builds skew price impact context from trading variables for a specific pair
 * @param tradingVariables Trading variables containing collateral data
 * @param pairIndex Index of the pair to build context for
 * @returns Skew price impact context for the pair
 */
export const buildSkewPriceImpactContext = (
  tradingVariables: TradingVariablesCollateral,
  pairIndex: number
): SkewPriceImpactContext => {
  const skewDepth = tradingVariables.pairSkewDepths?.[pairIndex] ?? 0;
  const pairOi = tradingVariables.pairOis?.[pairIndex];

  if (!pairOi) {
    throw new Error(`Pair OI data not found for pair index ${pairIndex}`);
  }

  return {
    skewDepth,
    pairOiToken: {
      oiLongToken: pairOi.token.long,
      oiShortToken: pairOi.token.short,
    },
  };
};
