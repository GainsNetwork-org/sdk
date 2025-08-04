import { GlobalTradingVariablesType } from "../../backend/tradingVariables/types";
import { TradeInfo, buildTradeClosingPriceImpactContext } from "..";
import { TradeEffectiveLeverageContext } from "./types";

/**
 * @dev Builds a complete context for effective leverage calculations
 * @dev Uses the closing price impact context builder as a sub-context
 * @param globalTradingVariables The transformed global trading variables from backend
 * @param collateralIndex The collateral index (1-based)
 * @param pairIndex The pair index
 * @param tradeInfo Trade information including createdBlock
 * @param additionalParams Additional parameters for price impact calculations
 * @returns Complete context ready for getTradeNewEffectiveLeverage
 */
export const buildTradeEffectiveLeverageContext = (
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
): TradeEffectiveLeverageContext | undefined => {
  // Build the closing price impact context which we'll use for PnL calculations
  const closingPriceImpactContext = buildTradeClosingPriceImpactContext(
    globalTradingVariables,
    collateralIndex,
    pairIndex,
    tradeInfo,
    additionalParams
  );

  if (!closingPriceImpactContext) {
    return undefined;
  }

  // Extract base spread from pairs data
  const pairs = globalTradingVariables.pairs;
  const baseSpreadP = pairs?.[pairIndex]?.spreadP || 0;

  return {
    closingPriceImpactContext,
    baseSpreadP,
  };
};
