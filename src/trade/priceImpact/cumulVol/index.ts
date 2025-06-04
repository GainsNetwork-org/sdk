/**
 * @dev Cumulative volume price impact calculations
 * @dev Mirrors contract's getTradeCumulVolPriceImpactP functionality
 */

import {
  LiquidationParams,
  OiWindows,
  OiWindowsSettings,
  PairDepth,
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
  pairDepth?: PairDepth | undefined;
  oiWindowsSettings?: OiWindowsSettings | undefined;
  oiWindows?: OiWindows | undefined;

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
  trader: string,
  pairIndex: number,
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

  const onePercentDepth = long
    ? // if `long`
      open
      ? context.pairDepth?.onePercentDepthAboveUsd
      : context.pairDepth?.onePercentDepthBelowUsd
    : // if `short`
    open
    ? context.pairDepth?.onePercentDepthBelowUsd
    : context.pairDepth?.onePercentDepthAboveUsd;

  let activeOi = undefined;

  if (context.oiWindowsSettings !== undefined) {
    activeOi = getActiveOi(
      getCurrentOiWindowId(context.oiWindowsSettings),
      context.oiWindowsSettings.windowsCount,
      context.oiWindows,
      open ? long : !long
    );
  }

  if (!onePercentDepth || activeOi === undefined) {
    return 0;
  }

  return (
    ((activeOi * getCumulativeFactor(updatedContext) +
      tradeOpenInterestUsd / 2) /
      onePercentDepth /
      100 /
      getLegacyFactor(updatedContext)) *
    getProtectionCloseFactor(updatedContext)
  );
};

/**
 * @dev Gets the base spread percentage
 * @param pairSpreadP Pair spread percentage
 * @param isLiquidation True if liquidation
 * @param liquidationParams Liquidation parameters
 * @param userPriceImpact User-specific price impact settings
 * @returns Base spread percentage
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
 * @param pairDepth 1% depth values for the pair
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
  pairDepth: PairDepth | undefined,
  oiWindowsSettings?: OiWindowsSettings | undefined,
  oiWindows?: OiWindows | undefined,
  context?: CumulVolContext | undefined
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
    {
      ...context,
      pairDepth,
      oiWindowsSettings,
      oiWindows,
    }
  );

  // If no depth or OI data, return just half spread
  if (cumulVolImpact === 0 && (!pairDepth || !oiWindowsSettings)) {
    return pairSpreadP / 2;
  }

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
