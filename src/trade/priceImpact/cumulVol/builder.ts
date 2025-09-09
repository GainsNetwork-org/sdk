import { GlobalTradingVariablesType } from "../../../backend/tradingVariables/types";
import { CumulVolContext } from "./index";

/**
 * @dev Builds cumulative volume price impact sub-context for a specific pair
 * @param globalTradingVariables The transformed global trading variables from backend
 * @param collateralIndex The collateral index (1-based)
 * @param pairIndex The pair index
 * @param additionalParams Additional parameters not available in trading variables
 * @returns Cumulative volume context ready for getTradeCumulVolPriceImpactP
 */
export const buildCumulVolContext = (
  globalTradingVariables: GlobalTradingVariablesType,
  collateralIndex: number,
  pairIndex: number,
  additionalParams: {
    currentBlock: number;
    contractsVersion?: number;
    isPnlPositive?: boolean;
    isOpen?: boolean;
    createdBlock?: number;
    userPriceImpact?: {
      cumulVolPriceImpactMultiplier: number;
      fixedSpreadP: number;
    };
    protectionCloseFactorWhitelist?: boolean;
  }
): CumulVolContext | undefined => {
  const collateral = globalTradingVariables.collaterals[collateralIndex - 1];

  if (!collateral) {
    return undefined;
  }

  // Get pair-specific data from global variables
  // TODO: Update to use pairDepthBands for v10.2
  const pairDepth = undefined; // globalTradingVariables.pairDepths?.[pairIndex];
  const pairFactor = globalTradingVariables.pairFactors?.[pairIndex];
  const oiWindows = globalTradingVariables.oiWindows?.[pairIndex];

  // Get OI windows settings (same for all pairs)
  // OI windows settings from global trading variables are already in SDK format
  const oiWindowsSettings = globalTradingVariables.oiWindowsSettings;

  // Get user-specific parameters from additionalParams
  const userPriceImpact = additionalParams.userPriceImpact;
  const protectionCloseFactorWhitelist =
    additionalParams.protectionCloseFactorWhitelist;

  // Get liquidation params - check both pair and group level
  const liquidationParams =
    globalTradingVariables.liquidationParams?.pairs?.[pairIndex] ||
    globalTradingVariables.liquidationParams?.groups?.[0]; // fallback to first group

  return {
    // Trade state
    isOpen: additionalParams.isOpen,
    isPnlPositive: additionalParams.isPnlPositive,
    createdBlock: additionalParams.createdBlock,

    // Protection factors
    liquidationParams,
    currentBlock: additionalParams.currentBlock,
    contractsVersion: additionalParams.contractsVersion,
    protectionCloseFactorWhitelist,

    // Price impact data
    pairDepth,
    oiWindowsSettings,
    oiWindows,

    // User/collateral specific
    userPriceImpact,
    collateralPriceUsd: collateral.prices?.collateralPriceUsd || 1,

    // Pair factors (spread across the context)
    ...pairFactor,
  };
};
