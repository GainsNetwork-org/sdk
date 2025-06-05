/**
 * @dev Main export file for OI module
 * @dev Provides unified Open Interest management functionality
 */

// Types
export { UnifiedPairOi, GroupOi, OiUsageMetadata, ComputedOi } from "./types";

// Converters
export {
  convertBeforeV10Collateral,
  convertCollateralOi,
  convertTokenOi,
  convertPairOi,
  convertPairOiArray,
  computeOiValues,
} from "./converter";

// Fetchers
export {
  fetchPairOi,
  fetchMultiplePairOi,
  createOiContext,
  fetchOiForUseCase,
} from "./fetcher";

// Validation
export {
  withinMaxPairOi,
  calculateDynamicOi,
  getRemainingOiCapacity,
  withinMaxGroupOiDynamic,
  getGroupDynamicOi,
  validateOiLimits,
} from "./validation";

// Usage metadata for documentation
import { OiUsageMetadata } from "./types";

export const OI_USAGE: OiUsageMetadata = {
  borrowingV1: ["beforeV10Collateral", "token"], // Dynamic: combines both with current price
  fundingFees: ["token"], // V10+ only: uses token OI
  skewImpact: ["token"], // V10+ only: uses token OI
  maxPairOi: ["beforeV10Collateral", "token"], // Dynamic: uses getPairTotalOiDynamicCollateral
  maxGroupOi: ["beforeV10Collateral", "token"], // Dynamic: same as borrowing v1
  maxSkew: ["token"], // V10+ only: uses token OI
};
