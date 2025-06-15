/**
 * @dev Main price impact module
 * @dev Exports cumulative volume, skew, and combined opening/closing price impact functionality
 */

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
  getTradeSkewPriceImpactWithChecks,
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
