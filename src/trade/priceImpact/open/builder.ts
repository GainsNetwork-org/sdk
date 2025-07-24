import { GlobalTradingVariablesType } from "../../../backend/tradingVariables/types";
import { buildCumulVolContext } from "../cumulVol/builder";
import { buildSkewPriceImpactContext } from "../skew/builder";
import { TradeOpeningPriceImpactContext } from "./types";

/**
 * @dev Builds a complete context for trade opening price impact calculations
 * @dev Uses sub-context builders to create properly scoped contexts
 * @param globalTradingVariables The transformed global trading variables from backend
 * @param collateralIndex The collateral index (1-based)
 * @param pairIndex The pair index
 * @param additionalParams Additional parameters not available in trading variables
 * @returns Complete context ready for getTradeOpeningPriceImpact
 */
export const buildTradeOpeningPriceImpactContext = (
  globalTradingVariables: GlobalTradingVariablesType,
  collateralIndex: number,
  pairIndex: number,
  additionalParams: {
    currentBlock: number;
    contractsVersion?: number;
    trader?: string;
    userPriceImpact?: {
      cumulVolPriceImpactMultiplier: number;
      fixedSpreadP: number;
    };
    protectionCloseFactorWhitelist?: boolean;
  }
): TradeOpeningPriceImpactContext | undefined => {
  const collateral = globalTradingVariables.collaterals[collateralIndex - 1];

  if (!collateral) {
    return undefined;
  }

  // Build cumulative volume subcontext
  const cumulVolContext = buildCumulVolContext(
    globalTradingVariables,
    collateralIndex,
    pairIndex,
    {
      currentBlock: additionalParams.currentBlock,
      contractsVersion: additionalParams.contractsVersion,
      isPnlPositive: false, // not relevant for opening
      isOpen: true,
      createdBlock: undefined, // not relevant for opening
      userPriceImpact: additionalParams.userPriceImpact,
      protectionCloseFactorWhitelist:
        additionalParams.protectionCloseFactorWhitelist,
    }
  );

  // Build skew price impact subcontext
  const skewContext = buildSkewPriceImpactContext(collateral, pairIndex);

  if (!cumulVolContext || !skewContext) {
    return undefined;
  }

  // Return structured context with proper subcontexts
  return {
    collateralPriceUsd: collateral.prices?.collateralPriceUsd || 1,
    cumulVolContext,
    skewContext,
  };
};
