/**
 * @dev Pure spread calculations without price impact
 * @dev For price impact calculations, see priceImpact module
 */

// Re-export from priceImpact/cumulVol for backward compatibility
export {
  getSpreadWithPriceImpactP,
  getSpreadWithCumulVolPriceImpactP,
  getTradeCumulVolPriceImpactP,
  getCumulVolPriceImpact,
  getProtectionCloseFactor,
  isProtectionCloseFactorActive,
  getCumulativeFactor,
  getLegacyFactor,
  getSpreadP,
  CumulVolContext as SpreadContext,
} from "./priceImpact/cumulVol";
