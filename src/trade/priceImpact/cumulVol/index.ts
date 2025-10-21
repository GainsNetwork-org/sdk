/**
 * @dev Cumulative volume price impact calculations
 * @dev Mirrors contract's getTradeCumulVolPriceImpactP functionality
 */

import { PairDepthBands, DepthBandsMapping, DepthBands } from "./types";
import {
  LiquidationParams,
  OiWindows,
  OiWindowsSettings,
  PairFactor,
  UserPriceImpact,
} from "../../types";
import { getActiveOi, getCurrentOiWindowId } from "../../oiWindows";
import {
  DEFAULT_CUMULATIVE_FACTOR,
  DEFAULT_PROTECTION_CLOSE_FACTOR,
} from "../../../constants";
import { ContractsVersion } from "../../../contracts/types";

export type CumulVolContext = {
  // Trade state
  isOpen?: boolean;
  isPnlPositive?: boolean;
  createdBlock?: number;

  // Protection factors
  liquidationParams?: LiquidationParams | undefined;
  currentBlock?: number | undefined;
  contractsVersion?: ContractsVersion | undefined;
  protectionCloseFactorWhitelist?: boolean;

  // Price impact data
  oiWindowsSettings?: OiWindowsSettings | undefined;
  oiWindows?: OiWindows | undefined;

  // Depth bands data (v10.2+)
  pairDepthBands?: PairDepthBands | undefined;
  depthBandsMapping?: DepthBandsMapping | undefined;

  // User/collateral specific
  userPriceImpact?: UserPriceImpact | undefined;
  collateralPriceUsd?: number;
} & Partial<PairFactor>;

/**
 * @dev Gets the protection close factor with user multiplier
 * @param context Cumulative volume context
 * @returns Protection close factor (1 = 100%)
 */
export const getProtectionCloseFactor = (
  context: CumulVolContext | undefined
): number => {
  const protectionCloseFactor =
    context === undefined ||
    context.contractsVersion === ContractsVersion.BEFORE_V9_2 ||
    context.isOpen === undefined ||
    context.isPnlPositive === undefined ||
    context.protectionCloseFactor === undefined ||
    isProtectionCloseFactorActive(context) !== true
      ? DEFAULT_PROTECTION_CLOSE_FACTOR
      : context.protectionCloseFactor;

  const protectionCloseFactorMultiplier =
    context?.userPriceImpact?.cumulVolPriceImpactMultiplier !== undefined &&
    context.userPriceImpact.cumulVolPriceImpactMultiplier > 0
      ? context.userPriceImpact.cumulVolPriceImpactMultiplier
      : 1;

  return protectionCloseFactor * protectionCloseFactorMultiplier;
};

/**
 * @dev Checks if protection close factor is active
 * @param context Cumulative volume context
 * @returns True if protection close factor should be applied
 */
export const isProtectionCloseFactorActive = (
  context: CumulVolContext | undefined
): boolean | undefined => {
  if (
    context === undefined ||
    context.currentBlock === undefined ||
    context.createdBlock === undefined ||
    context.protectionCloseFactorBlocks === undefined ||
    context.protectionCloseFactor === undefined
  ) {
    return undefined;
  }

  return (
    context.isPnlPositive === true &&
    context.isOpen === false &&
    context.protectionCloseFactor > 0 &&
    context.currentBlock <=
      context.createdBlock + context.protectionCloseFactorBlocks &&
    context.protectionCloseFactorWhitelist !== true
  );
};

/**
 * @dev Gets the cumulative factor for price impact calculation
 * @param context Cumulative volume context
 * @returns Cumulative factor (default 1)
 */
export const getCumulativeFactor = (
  context: CumulVolContext | undefined
): number => {
  if (
    context === undefined ||
    context.cumulativeFactor === undefined ||
    context.cumulativeFactor === 0
  ) {
    return DEFAULT_CUMULATIVE_FACTOR;
  }

  return context.cumulativeFactor;
};

/**
 * @dev Gets the legacy factor for v9.2 compatibility
 * @param context Cumulative volume context
 * @returns 1 for pre-v9.2, 2 for v9.2+
 */
export const getLegacyFactor = (
  context: CumulVolContext | undefined
): number => {
  return context?.contractsVersion === ContractsVersion.BEFORE_V9_2 ? 1 : 2;
};

/**
 * @dev Mirrors contract's _calculateDepthBandsPriceImpact function
 * @param tradeSizeUsd Trade size in USD (always positive here)
 * @param depthBandParams Depth band parameters
 * @returns Price impact percentage
 */
const _calculateDepthBandsPriceImpact = (
  tradeSizeUsd: number,
  depthBandParams: {
    depthBands: DepthBands;
    depthBandsMapping: DepthBandsMapping;
  }
): number => {
  const totalDepthUsd = depthBandParams.depthBands.totalDepthUsd;

  if (totalDepthUsd === 0 || tradeSizeUsd === 0) return 0;

  let remainingSizeUsd = tradeSizeUsd;
  let totalWeightedPriceImpactP = 0;
  let prevBandDepthUsd = 0;
  let topOfPrevBandOffsetPpm = 0;

  for (let i = 0; i < 30 && remainingSizeUsd !== 0; i++) {
    const bandLiquidityPercentageBps = depthBandParams.depthBands.bands[i]; // Already in 0-1 format
    const topOfBandOffsetPpm = depthBandParams.depthBandsMapping.bands[i]; // Already in 0-1 format
    const bandDepthUsd = bandLiquidityPercentageBps * totalDepthUsd;

    // Skip if band has same depth as previous (would cause division by zero)
    if (bandDepthUsd <= prevBandDepthUsd) {
      prevBandDepthUsd = bandDepthUsd;
      topOfPrevBandOffsetPpm = topOfBandOffsetPpm;
      continue;
    }

    // Since bandDepthUsd represents liquidity from mid price to top of band, we need to subtract previous band depth
    const bandAvailableDepthUsd = bandDepthUsd - prevBandDepthUsd;
    let depthConsumedUsd;

    // At 100% band always consume all remaining size, even if more than band available depth
    if (
      bandLiquidityPercentageBps === 1 ||
      remainingSizeUsd <= bandAvailableDepthUsd
    ) {
      depthConsumedUsd = remainingSizeUsd;
      remainingSizeUsd = 0;
    } else {
      // Normal case: consume entire band and continue to next
      depthConsumedUsd = bandAvailableDepthUsd;
      remainingSizeUsd -= bandAvailableDepthUsd;
    }

    // Calculate impact contribution from this band using trapezoidal rule
    // Low = previous band's price offset, High = current band's price offset
    const lowOffsetP = topOfPrevBandOffsetPpm;
    const offsetRangeP = topOfBandOffsetPpm - topOfPrevBandOffsetPpm;

    // Calculate average impact using trapezoidal rule: low + (range * fraction / 2)
    const avgImpactP =
      lowOffsetP +
      (offsetRangeP * depthConsumedUsd) / bandAvailableDepthUsd / 2;

    totalWeightedPriceImpactP += avgImpactP * depthConsumedUsd;

    // Update previous values for next iteration
    topOfPrevBandOffsetPpm = topOfBandOffsetPpm;
    prevBandDepthUsd = bandDepthUsd;
  }

  return totalWeightedPriceImpactP / tradeSizeUsd;
};

/**
 * @dev Mirrors contract's _getDepthBandsPriceImpactP function
 * @param cumulativeVolumeUsd Cumulative volume in USD (can be negative)
 * @param tradeSizeUsd Trade size in USD (can be negative)
 * @param depthBandParams Depth band parameters (contains both pair bands and global mapping)
 * @param priceImpactFactor Price impact factor (protection close factor)
 * @param cumulativeFactor Cumulative factor for volume impact
 * @returns Price impact percentage (can be negative)
 */
const _getDepthBandsPriceImpactP = (
  cumulativeVolumeUsd: number,
  tradeSizeUsd: number,
  depthBandParams: {
    depthBands: DepthBands;
    depthBandsMapping: DepthBandsMapping;
  },
  priceImpactFactor: number,
  cumulativeFactor: number
): number => {
  // Check for opposite signs
  if (
    (cumulativeVolumeUsd > 0 && tradeSizeUsd < 0) ||
    (cumulativeVolumeUsd < 0 && tradeSizeUsd > 0)
  ) {
    throw new Error(
      "Wrong params: cumulative volume and trade size have opposite signs"
    );
  }

  const effectiveCumulativeVolumeUsd = cumulativeVolumeUsd * cumulativeFactor;
  const totalSizeLookupUsd = effectiveCumulativeVolumeUsd + tradeSizeUsd;

  const isNegative = totalSizeLookupUsd < 0;

  const effectiveCumulativeVolumeUsdUint = isNegative
    ? -effectiveCumulativeVolumeUsd
    : effectiveCumulativeVolumeUsd;
  const totalSizeLookupUsdUint = isNegative
    ? -totalSizeLookupUsd
    : totalSizeLookupUsd;

  const cumulativeVolPriceImpactP = _calculateDepthBandsPriceImpact(
    effectiveCumulativeVolumeUsdUint,
    depthBandParams
  );
  const totalSizePriceImpactP = _calculateDepthBandsPriceImpact(
    totalSizeLookupUsdUint,
    depthBandParams
  );

  const unscaledPriceImpactP =
    cumulativeVolPriceImpactP +
    (totalSizePriceImpactP - cumulativeVolPriceImpactP) / 2;

  const scaledPriceImpactP = unscaledPriceImpactP * priceImpactFactor;

  return isNegative ? -scaledPriceImpactP : scaledPriceImpactP;
};

/**
 * @dev Calculates cumulative volume price impact percentage
 * @dev Mirrors contract's getTradeCumulVolPriceImpactP function
 * @param trader Trader address
 * @param pairIndex Trading pair index
 * @param long True for long, false for short
 * @param tradeOpenInterestUsd Position size in USD
 * @param isPnlPositive Whether PnL is positive (only relevant when closing)
 * @param open True for opening, false for closing
 * @param lastPosIncreaseBlock Last block when position was increased (only relevant when closing)
 * @param context Additional context with depths, OI data, and factors
 * @returns Cumulative volume price impact percentage (not including spread)
 */
export const getTradeCumulVolPriceImpactP = (
  _trader: string, // Unused - kept for compatibility
  _pairIndex: number, // Unused - kept for compatibility
  long: boolean,
  tradeOpenInterestUsd: number,
  isPnlPositive: boolean,
  open: boolean,
  lastPosIncreaseBlock: number,
  context: CumulVolContext
): number => {
  // Update context with passed parameters
  const updatedContext = {
    ...context,
    isOpen: open,
    isPnlPositive: isPnlPositive,
    createdBlock: context.createdBlock || lastPosIncreaseBlock,
  };

  if (
    // No price impact when closing pre-v9.2 trades
    (!open && context?.contractsVersion === ContractsVersion.BEFORE_V9_2) ||
    // No price impact for opens when `pair.exemptOnOpen` is true
    (open && context?.exemptOnOpen === true) ||
    // No price impact for closes after `protectionCloseFactor` has expired
    // when `pair.exemptAfterProtectionCloseFactor` is true
    (!open &&
      context?.exemptAfterProtectionCloseFactor === true &&
      isProtectionCloseFactorActive(updatedContext) !== true)
  ) {
    return 0;
  }

  const tradePositiveSkew = (long && open) || (!long && !open);
  const tradeSkewMultiplier = tradePositiveSkew ? 1 : -1;

  if (!context.pairDepthBands || !context.depthBandsMapping) {
    return 0;
  }

  // Select depth bands based on trade direction
  const depthBands = tradePositiveSkew
    ? context.pairDepthBands.above
    : context.pairDepthBands.below;

  // Return 0 if no depth bands configured (matching contract lines 588-590)
  if (!depthBands || depthBands.totalDepthUsd === 0) {
    return 0;
  }

  // Get active OI for cumulative volume calculation
  let activeOi = 0;
  if (context.oiWindowsSettings !== undefined) {
    activeOi =
      getActiveOi(
        getCurrentOiWindowId(context.oiWindowsSettings),
        context.oiWindowsSettings.windowsCount,
        context.oiWindows,
        open ? long : !long
      ) || 0;
  }

  const signedActiveOi = activeOi * tradeSkewMultiplier;
  const signedTradeOi = tradeOpenInterestUsd * tradeSkewMultiplier;

  // Calculate price impact using depth bands
  const priceImpactP = _getDepthBandsPriceImpactP(
    signedActiveOi,
    signedTradeOi,
    {
      depthBands: depthBands,
      depthBandsMapping: context.depthBandsMapping,
    },
    getProtectionCloseFactor(updatedContext),
    getCumulativeFactor(updatedContext)
  );

  return priceImpactP;
};

/**
 * @dev Gets the fixed spread percentage with direction
 * @dev Mirrors contract's getFixedSpreadP function
 * @param spreadP Total spread percentage (includes base + user spread)
 * @param long True for long position
 * @param open True for opening, false for closing
 * @returns Signed spread percentage (positive or negative based on direction)
 */
export const getFixedSpreadP = (
  spreadP: number,
  long: boolean,
  open: boolean
): number => {
  // Reverse spread direction on close
  const effectiveLong = open ? long : !long;

  // Calculate half spread
  const fixedSpreadP = spreadP / 2;

  // Apply direction
  return effectiveLong ? fixedSpreadP : -fixedSpreadP;
};

/**
 * @dev Gets the base spread percentage
 * @param pairSpreadP Pair spread percentage
 * @param isLiquidation True if liquidation
 * @param liquidationParams Liquidation parameters
 * @param userPriceImpact User-specific price impact settings
 * @returns Base spread percentage
 * @todo Review if this function still makes sense or should use getFixedSpreadP pattern
 *       Currently it may double-count user fixed spread if pairSpreadP already includes it
 */
export const getSpreadP = (
  pairSpreadP: number | undefined,
  isLiquidation?: boolean | undefined,
  liquidationParams?: LiquidationParams | undefined,
  userPriceImpact?: UserPriceImpact | undefined
): number => {
  const fixedSpreadP = userPriceImpact?.fixedSpreadP ?? 0;

  if (pairSpreadP === undefined || (pairSpreadP === 0 && fixedSpreadP === 0)) {
    return 0;
  }

  const spreadP = pairSpreadP / 2 + fixedSpreadP;

  return isLiquidation === true &&
    liquidationParams !== undefined &&
    liquidationParams.maxLiqSpreadP > 0 &&
    spreadP > liquidationParams.maxLiqSpreadP
    ? liquidationParams.maxLiqSpreadP
    : spreadP;
};

/**
 * @dev Gets spread with cumulative volume price impact
 * @dev This combines base spread + cumulative volume impact
 * @param pairSpreadP Base pair spread percentage
 * @param buy True for long, false for short
 * @param collateral Collateral amount
 * @param leverage Position leverage
 * @param oiWindowsSettings OI windows configuration
 * @param oiWindows Current OI windows data
 * @param context Additional context for the calculation
 * @returns Total spread + cumulative volume price impact percentage
 */
export const getSpreadWithCumulVolPriceImpactP = (
  pairSpreadP: number,
  buy: boolean,
  collateral: number,
  leverage: number,
  context: CumulVolContext
): number => {
  if (pairSpreadP === undefined) {
    return 0;
  }

  const baseSpread = getSpreadP(
    pairSpreadP,
    undefined,
    undefined,
    context?.userPriceImpact
  );

  // Calculate position size in USD
  const positionSizeUsd =
    collateral * leverage * (context?.collateralPriceUsd || 1);

  const cumulVolImpact = getTradeCumulVolPriceImpactP(
    "", // trader - not used in calculation
    0, // pairIndex - not used in calculation
    buy,
    positionSizeUsd,
    context?.isPnlPositive || false,
    context?.isOpen !== false,
    context?.createdBlock || 0,
    context
  );

  return baseSpread + cumulVolImpact;
};

/**
 * @dev Convenience function for calculating cumulative volume price impact
 * @dev Uses collateral and leverage instead of USD position size
 * @param buy True for long, false for short
 * @param collateral Collateral amount
 * @param leverage Position leverage
 * @param open True for opening, false for closing
 * @param context Full context including depths, OI data, and collateral price
 * @returns Cumulative volume price impact percentage
 */
export const getCumulVolPriceImpact = (
  buy: boolean,
  collateral: number,
  leverage: number,
  open: boolean,
  context: CumulVolContext & {
    collateralPriceUsd: number; // This is required for USD conversion
  }
): number => {
  const positionSizeUsd = collateral * leverage * context.collateralPriceUsd;

  return getTradeCumulVolPriceImpactP(
    "", // trader - not used in calculation
    0, // pairIndex - not used in calculation
    buy,
    positionSizeUsd,
    context.isPnlPositive || false,
    open,
    context.createdBlock || 0,
    context
  );
};

// Legacy export for backward compatibility
export const getSpreadWithPriceImpactP = getSpreadWithCumulVolPriceImpactP;

// Export converters
export {
  convertOiWindowsSettings,
  convertOiWindow,
  convertOiWindows,
  convertOiWindowsSettingsArray,
} from "./converter";

// Export builder
export { buildCumulVolContext } from "./builder";
