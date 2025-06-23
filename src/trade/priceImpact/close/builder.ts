import { GlobalTradingVariablesType } from "../../../backend/tradingVariables/types";
import { buildCumulVolContext } from "../cumulVol/builder";
import { buildSkewPriceImpactContext } from "../skew/builder";
import { TradeClosingPriceImpactContext } from "./types";
import { TradeInfo } from "../../types";

/**
 * @dev Builds a complete context for trade closing price impact calculations
 * @dev Uses sub-context builders to create properly scoped contexts
 * @param globalTradingVariables The transformed global trading variables from backend
 * @param collateralIndex The collateral index (1-based)
 * @param pairIndex The pair index
 * @param tradeInfo Trade information including createdBlock
 * @param additionalParams Additional parameters not available in trading variables
 * @returns Complete context ready for getTradeClosingPriceImpact
 */
export const buildTradeClosingPriceImpactContext = (
  globalTradingVariables: GlobalTradingVariablesType,
  collateralIndex: number,
  pairIndex: number,
  tradeInfo: TradeInfo,
  additionalParams: {
    currentBlock: number;
    contractsVersion?: number;
    isPnlPositive?: boolean;
    userPriceImpact?: {
      cumulVolPriceImpactMultiplier: number;
      fixedSpreadP: number;
    };
    protectionCloseFactorWhitelist?: boolean;
  }
): TradeClosingPriceImpactContext | undefined => {
  const collateral = globalTradingVariables.collaterals[collateralIndex - 1];

  if (!collateral) {
    return undefined;
  }

  // Build cumulative volume subcontext for closing
  const cumulVolContext = buildCumulVolContext(
    globalTradingVariables,
    collateralIndex,
    pairIndex,
    {
      currentBlock: additionalParams.currentBlock,
      contractsVersion:
        additionalParams.contractsVersion || tradeInfo.contractsVersion,
      isPnlPositive: additionalParams.isPnlPositive,
      isOpen: false, // always false for closing
      createdBlock: tradeInfo.createdBlock,
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
    tradeInfo,
  };
};
