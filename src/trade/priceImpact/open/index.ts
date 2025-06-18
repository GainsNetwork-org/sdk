/**
 * @dev Trade opening price impact calculations
 * @dev Mirrors contract's TradingCommonUtils.getTradeOpeningPriceImpact
 */

import {
  TradeOpeningPriceImpactInput,
  TradeOpeningPriceImpactContext,
  TradeOpeningPriceImpactResult,
} from "./types";
import { getFixedSpreadP, getTradeCumulVolPriceImpactP } from "../cumulVol";
import { getTradeSkewPriceImpactWithChecks } from "../skew";
import { getPriceAfterImpact } from "../";

// Re-export types
export type {
  TradeOpeningPriceImpactInput,
  TradeOpeningPriceImpactContext,
  TradeOpeningPriceImpactResult,
};

// Export builder
export { buildTradeOpeningPriceImpactContext } from "./builder";

/**
 * @dev Calculates all price impacts for trade opening
 * @dev Mirrors contract's getTradeOpeningPriceImpact function
 * @param input Trade parameters
 * @param context Combined context for calculations
 * @returns Price impact breakdown and final price
 */
export const getTradeOpeningPriceImpact = (
  input: TradeOpeningPriceImpactInput,
  context: TradeOpeningPriceImpactContext
): TradeOpeningPriceImpactResult => {
  const positionSizeCollateral = input.collateralAmount * input.leverage;

  // Calculate fixed spread
  const spreadP = getFixedSpreadP(
    input.pairSpreadP,
    input.long,
    true // opening
  );

  // Calculate position size in USD
  const positionSizeUsd = positionSizeCollateral * context.collateralPriceUsd;

  // Calculate cumulative volume price impact
  const cumulVolPriceImpactP = getTradeCumulVolPriceImpactP(
    "", // trader - not needed for calculation
    input.pairIndex,
    input.long,
    positionSizeUsd,
    false, // isPnlPositive - not relevant for opening
    true, // open
    0, // lastPosIncreaseBlock - not relevant for opening
    context.cumulVolContext
  );

  // Calculate skew price impact (v10+ only)
  const skewPriceImpactP = getTradeSkewPriceImpactWithChecks(
    {
      collateralIndex: input.collateralIndex,
      pairIndex: input.pairIndex,
      long: input.long,
      open: true,
      positionSizeCollateral,
      currentPrice: input.openPrice,
      contractsVersion: input.contractsVersion,
      isCounterTrade: input.isCounterTrade,
    },
    context.skewContext
  );

  // Total price impact (signed - can be positive or negative)
  // Spread is always positive, impacts can be negative
  const totalPriceImpactP = spreadP + cumulVolPriceImpactP + skewPriceImpactP;

  // Calculate final price after impact using the same formula as Solidity
  const priceAfterImpact = getPriceAfterImpact(
    input.openPrice,
    totalPriceImpactP
  );

  // Calculate percent profit from impact
  // For longs: negative impact = profit (price goes down, good for buyer)
  // For shorts: positive impact = profit (price goes up, good for seller)
  const percentProfitP = -totalPriceImpactP;

  return {
    priceAfterImpact,
    priceImpactP: Math.abs(totalPriceImpactP), // Absolute value for compatibility
    percentProfitP,
    cumulVolPriceImpactP,
    skewPriceImpactP,
    totalPriceImpactP,
  };
};

/**
 * @dev Simplified version using current market price
 * @param input Trade parameters
 * @param context Combined context
 * @param currentMarketPrice Current market price to use as open price
 * @returns Price impact breakdown and final price
 */
export const getTradeOpeningPriceImpactAtMarket = (
  input: Omit<TradeOpeningPriceImpactInput, "openPrice">,
  context: TradeOpeningPriceImpactContext,
  currentMarketPrice: number
): TradeOpeningPriceImpactResult => {
  return getTradeOpeningPriceImpact(
    {
      ...input,
      openPrice: currentMarketPrice,
    },
    context
  );
};
