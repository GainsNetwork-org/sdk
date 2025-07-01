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
import { getTradeSkewPriceImpact } from "../skew";
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

  // Calculate price after spread and cumulative volume impact (before skew)
  const priceAfterSpreadAndCumulVolPriceImpact = getPriceAfterImpact(
    input.openPrice,
    spreadP + cumulVolPriceImpactP
  );

  // Calculate position size in tokens using the price after fixed spread and cumul vol impact
  const positionSizeToken =
    positionSizeCollateral / priceAfterSpreadAndCumulVolPriceImpact;

  // Calculate skew price impact (v10+ only)
  const skewPriceImpactObject = getTradeSkewPriceImpact(
    {
      collateralIndex: input.collateralIndex,
      pairIndex: input.pairIndex,
      long: input.long,
      open: true,
      positionSizeToken,
    },
    context.skewContext
  );
  const skewPriceImpactP = skewPriceImpactObject.totalPriceImpactP;

  // Total price impact (signed - can be positive or negative)
  const totalPriceImpactP = spreadP + cumulVolPriceImpactP + skewPriceImpactP;
  const totalPriceImpactPFromMarketPrice =
    spreadP + cumulVolPriceImpactP + skewPriceImpactObject.tradePriceImpactP;

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
    percentProfitP,
    cumulVolPriceImpactP,
    baseSkewPriceImpactP: skewPriceImpactObject.basePriceImpactP,
    tradeSkewPriceImpactP: skewPriceImpactObject.tradePriceImpactP,
    totalSkewPriceImpactP: skewPriceImpactObject.totalPriceImpactP,
    totalPriceImpactP,
    totalPriceImpactPFromMarketPrice,
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
