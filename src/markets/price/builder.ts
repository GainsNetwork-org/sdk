/**
 * @dev Builder functions for creating market price contexts
 */

import { MarketPriceContext } from "./types";
import { TradingVariablesCollateral } from "../../backend/tradingVariables/types";

/**
 * @dev Builds a market price context for a specific pair from trading variables
 * @param tradingVariables Trading variables for a specific collateral
 * @param pairIndex Pair index to create context for
 * @returns Market price context for the pair
 */
export const buildMarketPriceContext = (
  tradingVariables: TradingVariablesCollateral,
  pairIndex: number
): MarketPriceContext => {
  // Get skew depth for the pair, default to 0 if not set
  const skewDepth = tradingVariables.pairSkewDepths[pairIndex] || 0;

  // Get pair OI data
  const pairOi = tradingVariables.pairOis[pairIndex];

  if (!pairOi) {
    // Return default context if no OI data
    return {
      skewDepth,
      pairOiToken: {
        oiLongToken: 0,
        oiShortToken: 0,
      },
    };
  }

  // Extract token OI from unified pair OI
  const pairOiToken = {
    oiLongToken: pairOi.token.long,
    oiShortToken: pairOi.token.short,
  };

  return {
    skewDepth,
    pairOiToken,
  };
};

/**
 * @dev Creates an empty market price context
 * @returns Empty market price context
 */
export const createEmptyMarketPriceContext = (): MarketPriceContext => {
  return {
    skewDepth: 0,
    pairOiToken: {
      oiLongToken: 0,
      oiShortToken: 0,
    },
  };
};

/**
 * @dev Creates a market price context with custom values
 * @param skewDepth Skew depth in tokens
 * @param oiLongToken Long OI in tokens
 * @param oiShortToken Short OI in tokens
 * @returns Market price context
 */
export const createMarketPriceContext = (
  skewDepth: number,
  oiLongToken: number,
  oiShortToken: number
): MarketPriceContext => {
  return {
    skewDepth,
    pairOiToken: {
      oiLongToken,
      oiShortToken,
    },
  };
};
