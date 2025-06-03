/**
 * @dev Main price impact module
 * @dev Exports skew price impact functionality (v10+)
 * @dev Cumulative volume price impact remains in spread.ts for now
 */

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
