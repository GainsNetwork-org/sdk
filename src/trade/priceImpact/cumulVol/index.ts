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
  isOpen?: boolean;
  isPnlPositive?: boolean;
  createdBlock?: number;
  liquidationParams?: LiquidationParams | undefined;
  currentBlock?: number | undefined;
  contractsVersion?: ContractsVersion | undefined;
  protectionCloseFactorWhitelist?: boolean;
  userPriceImpact?: UserPriceImpact | undefined;
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
export const getTradeCumulVolPriceImpactP = (
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

  if (
    // No spread or price impact when closing pre-v9.2 trades
    (context?.isOpen === false &&
      context?.contractsVersion === ContractsVersion.BEFORE_V9_2) ||
    // No spread or price impact for opens when `pair.exemptOnOpen` is true
    (context?.isOpen === true && context?.exemptOnOpen === true) ||
    // No spread or price impact for closes after `protectionCloseFactor` has expired
    // when `pair.exemptAfterProtectionCloseFactor` is true
    (context?.isOpen === false &&
      context?.exemptAfterProtectionCloseFactor === true &&
      isProtectionCloseFactorActive(context) !== true)
  ) {
    return 0;
  }

  const onePercentDepth = buy
    ? // if `long`
      context?.isOpen !== false // assumes it's an open unless it's explicitly false
      ? pairDepth?.onePercentDepthAboveUsd
      : pairDepth?.onePercentDepthBelowUsd
    : // if `short`
    context?.isOpen !== false
    ? pairDepth?.onePercentDepthBelowUsd
    : pairDepth?.onePercentDepthAboveUsd;

  let activeOi = undefined;

  if (oiWindowsSettings !== undefined) {
    activeOi = getActiveOi(
      getCurrentOiWindowId(oiWindowsSettings),
      oiWindowsSettings.windowsCount,
      oiWindows,
      context?.isOpen !== false ? buy : !buy
    );
  }

  if (!onePercentDepth || activeOi === undefined || collateral === undefined) {
    return pairSpreadP / 2;
  }

  return (
    getSpreadP(pairSpreadP, undefined, undefined, context?.userPriceImpact) +
    ((activeOi * getCumulativeFactor(context) + (collateral * leverage) / 2) /
      onePercentDepth /
      100 /
      getLegacyFactor(context)) *
      getProtectionCloseFactor(context)
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

// Legacy export for backward compatibility
export const getSpreadWithPriceImpactP = getTradeCumulVolPriceImpactP;
