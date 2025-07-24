/**
 * @dev Skew price impact calculations for v10+ trades
 * @dev Based on formula: (existingSkew + tradeSize/2) / skewDepth
 */

import {
  PairOiToken,
  SkewPriceImpactInput,
  SkewPriceImpactResult,
  SkewPriceImpactContext,
  TradeSkewParams,
} from "./types";
import { calculatePositionSizeToken } from "../../utils";
import { ContractsVersion } from "../../../contracts/types";

// Constants
const PRICE_IMPACT_DIVIDER = 2; // Half price impact to match cumulative volume impact scale

/**
 * @dev Calculates net skew in tokens (long - short)
 * @param pairOi Pair OI data with long and short token amounts
 * @returns Net skew in tokens (positive = long heavy, negative = short heavy)
 */
export const getNetSkewToken = (pairOi: PairOiToken): number => {
  return pairOi.oiLongToken - pairOi.oiShortToken;
};

/**
 * @dev Calculates net skew in collateral
 * @param netSkewToken Net skew in tokens
 * @param currentPrice Current pair price
 * @returns Net skew in collateral
 */
export const getNetSkewCollateral = (
  netSkewToken: number,
  currentPrice: number
): number => {
  return netSkewToken * currentPrice;
};

/**
 * @dev Determines trade direction impact on skew
 * @param long Is long position
 * @param open Is opening (true) or closing (false)
 * @returns Whether trade increases or decreases skew
 */
export const getTradeSkewDirection = (
  long: boolean,
  open: boolean
): boolean => {
  // Opening long or closing short increases positive skew
  // Opening short or closing long increases negative skew
  return (long && open) || (!long && !open);
};

/**
 * @dev Core skew price impact calculation
 * @param existingSkewToken Current net skew in tokens (signed)
 * @param tradeSizeToken Trade size in tokens (always positive)
 * @param skewDepth Skew depth in tokens
 * @param tradePositiveSkew Whether trade increases skew in its direction
 * @returns Price impact percentage (can be positive or negative)
 */
export const calculateSkewPriceImpactP = (
  existingSkewToken: number,
  tradeSizeToken: number,
  skewDepth: number,
  tradePositiveSkew: boolean
): number => {
  if (skewDepth === 0) {
    return 0; // No impact if depth is 0
  }

  // Convert signed values based on trade direction
  const tradeSkewMultiplier = tradePositiveSkew ? 1 : -1;
  const signedExistingSkew = existingSkewToken;
  const signedTradeSize = tradeSizeToken * tradeSkewMultiplier;

  // (existingSkew + tradeSize/2) / skewDepth
  const numerator = signedExistingSkew + signedTradeSize / 2;
  const priceImpactP = numerator / skewDepth;

  // Apply divider to match cumulative volume impact scale
  return priceImpactP / PRICE_IMPACT_DIVIDER;
};

/**
 * @dev Main function to calculate skew price impact for a trade
 * @param input Trade parameters
 * @param context Skew price impact context with depths and OI data
 * @returns Skew price impact result
 */
export const getTradeSkewPriceImpact = (
  input: SkewPriceImpactInput,
  context: SkewPriceImpactContext
): SkewPriceImpactResult => {
  // Get skew depth and pair OI from simplified context
  const { skewDepth, pairOiToken: pairOi } = context;

  // Calculate net skew
  const netSkewToken = getNetSkewToken(pairOi);

  // Determine trade direction
  const tradePositiveSkew = getTradeSkewDirection(input.long, input.open);

  // Calculate price impact
  const basePriceImpactP = calculateSkewPriceImpactP(
    netSkewToken,
    0,
    skewDepth,
    tradePositiveSkew
  );

  // Calculate price impact
  const totalPriceImpactP = calculateSkewPriceImpactP(
    netSkewToken,
    input.positionSizeToken,
    skewDepth,
    tradePositiveSkew
  );

  const tradePriceImpactP = totalPriceImpactP - basePriceImpactP;

  // Determine trade direction relative to skew
  let tradeDirection: "increase" | "decrease" | "neutral";
  if (totalPriceImpactP > 0) {
    tradeDirection = "increase";
  } else if (totalPriceImpactP < 0) {
    tradeDirection = "decrease";
  } else {
    tradeDirection = "neutral";
  }

  return {
    basePriceImpactP,
    tradePriceImpactP,
    totalPriceImpactP,
    netSkewToken,
    netSkewCollateral: 0, // To be calculated with price if needed
    tradeDirection,
  };
};

/**
 * @dev Calculate position sizes for partial operations
 * @param originalSizeCollateral Original position size in collateral
 * @param deltaCollateral Position size delta in collateral
 * @param originalSizeToken Original position size in tokens
 * @returns Delta in tokens proportional to collateral delta
 */
export const calculatePartialSizeToken = (
  originalSizeCollateral: number,
  deltaCollateral: number,
  originalSizeToken: number
): number => {
  if (originalSizeCollateral === 0) {
    return 0;
  }

  // For partial close/add, token delta is proportional to collateral delta
  return (deltaCollateral * originalSizeToken) / originalSizeCollateral;
};

// Export namespace for types
export * as SkewPriceImpact from "./types";
export * from "./converter";
export * from "./builder";
export * from "./fetcher";
