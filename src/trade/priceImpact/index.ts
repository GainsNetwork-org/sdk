/**
 * @dev Main price impact module
 * @dev Exports both cumulative volume and skew price impact functionality
 */

// Export cumulative volume price impact functionality
export {
  // Core functions
  getTradeCumulVolPriceImpactP,
  getSpreadWithPriceImpactP, // Legacy alias
  getProtectionCloseFactor,
  isProtectionCloseFactorActive,
  getCumulativeFactor,
  getLegacyFactor,
  getSpreadP,
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
  normalizeSkewDepth,
  createSkewDepth,
  createSkewPriceImpactContext,
  isValidSkewDepth,
  convertSkewDepthsArray,
  mergeSkewPriceImpactContexts,
} from "./skew/converter";

// Re-export all types for convenience
export type {
  PairOiToken,
  PairOiCollateral,
  SkewDepth,
  SkewPriceImpactInput,
  SkewPriceImpactResult,
  SkewPriceImpactContext,
  TradeSkewParams,
  PositionSizeResult,
} from "./skew/types";
