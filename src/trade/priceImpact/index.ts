/**
 * @dev Main price impact module
 * @dev Exports cumulative volume, skew, and combined opening/closing price impact functionality
 */

/**
 * @dev Calculates price after impact using the same formula as the Solidity contract
 * @dev Mirrors contract's getPriceAfterImpact function
 * @param oraclePrice Base oracle price (no decimals requirement)
 * @param totalPriceImpactP Total price impact percentage (can be positive or negative)
 * @returns Price after impact has been applied
 */
export const getPriceAfterImpact = (
  oraclePrice: number,
  totalPriceImpactP: number
): number => {
  // Match Solidity: price = oraclePrice + (oraclePrice * totalPriceImpactP / 100)
  const priceAfterImpact = oraclePrice * (1 + totalPriceImpactP / 100);

  if (priceAfterImpact <= 0) {
    throw new Error("Price after impact must be positive");
  }

  return priceAfterImpact;
};

// Export trade opening price impact functionality
export {
  // Core functions
  getTradeOpeningPriceImpact,
  getTradeOpeningPriceImpactAtMarket,
  // Builder
  buildTradeOpeningPriceImpactContext,
  // Types
  TradeOpeningPriceImpactInput,
  TradeOpeningPriceImpactContext,
  TradeOpeningPriceImpactResult,
} from "./open";

// Export trade closing price impact functionality
export {
  // Core functions
  getTradeClosingPriceImpact,
  getTradeClosingPriceImpactAtOracle,
  // Builder
  buildTradeClosingPriceImpactContext,
  // Types
  TradeClosingPriceImpactInput,
  TradeClosingPriceImpactContext,
  TradeClosingPriceImpactResult,
} from "./close";

// Export cumulative volume price impact functionality
export {
  // Core functions
  getTradeCumulVolPriceImpactP,
  getCumulVolPriceImpact, // Convenience function
  getSpreadWithCumulVolPriceImpactP,
  getSpreadWithPriceImpactP, // Legacy alias
  getProtectionCloseFactor,
  isProtectionCloseFactorActive,
  getCumulativeFactor,
  getLegacyFactor,
  getFixedSpreadP,
  getSpreadP,
  // Converters
  convertOiWindowsSettings,
  convertOiWindow,
  convertOiWindows,
  convertOiWindowsSettingsArray,
  // Builder
  buildCumulVolContext,
  // Types
  CumulVolContext,
} from "./cumulVol";

// Export skew price impact functionality
export {
  // Core functions
  getNetSkewToken,
  getNetSkewCollateral,
  getTradeSkewDirection,
  calculateSkewPriceImpactP,
  getTradeSkewPriceImpact,
  calculatePartialSizeToken,
  // Types namespace
  SkewPriceImpact,
} from "./skew";

// Export converters
export {
  convertPairOiToken,
  convertPairOiTokenArray,
  convertPairOiCollateral,
  convertPairOiCollateralArray,
  convertSkewDepth,
  convertPairSkewDepths,
} from "./skew/converter";

// Export builders
export { buildSkewPriceImpactContext } from "./skew/builder";

// Re-export all types for convenience
export type {
  PairOiToken,
  PairOiCollateral,
  SkewPriceImpactInput,
  SkewPriceImpactResult,
  SkewPriceImpactContext,
  TradeSkewParams,
  PositionSizeResult,
} from "./skew/types";
