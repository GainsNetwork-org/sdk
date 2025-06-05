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

// Usage metadata for documentation
import { OiUsageMetadata } from "./types";

export const OI_USAGE: OiUsageMetadata = {
  borrowingV1: ["beforeV10Collateral", "token"],
  fundingFees: ["token"],
  skewImpact: ["token"],
  maxPairOi: ["beforeV10Collateral", "collateral"],
  maxGroupOi: ["beforeV10Collateral", "collateral"],
  maxSkew: ["token"],
};
