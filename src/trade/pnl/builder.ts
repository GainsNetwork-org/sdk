import { TradeContainer } from "../types";

import { buildBorrowingV2Context } from "../fees/borrowingV2/builder";
import { buildFundingContext } from "../fees/fundingFees/builder";
import { buildBorrowingV1Context as buildBorrowingV1ContextFromBuilder } from "../fees/borrowing/builder";
import { buildTradingFeesContext } from "../fees/trading/builder";
import { GlobalTradingVariablesType } from "src/backend/tradingVariables/types";
import { GetComprehensivePnlContext } from "./types";

/**
 * @dev Builds a complete context for comprehensive PnL calculations
 * @dev Uses sub-context builders to create properly scoped contexts
 * @param globalTradingVariables The transformed global trading variables from backend
 * @param tradeContainer Full trade container with trade, tradeInfo, fees data and liquidation params
 * @param additionalParams Additional parameters not available in trading variables
 * @returns Complete context ready for getComprehensivePnl
 */
export const buildComprehensivePnlContext = (
  globalTradingVariables: GlobalTradingVariablesType,
  tradeContainer: TradeContainer,
  additionalParams: {
    currentBlock: number;
    currentTimestamp: number;
    traderFeeMultiplier?: number;
  }
): GetComprehensivePnlContext => {
  const { trade, tradeInfo } = tradeContainer;
  const collateralIndex = trade.collateralIndex || 1;
  const collateral = globalTradingVariables.collaterals[collateralIndex - 1];

  return {
    // Core shared context
    core: {
      currentBlock: additionalParams.currentBlock,
      currentTimestamp: additionalParams.currentTimestamp,
      collateralPriceUsd: collateral.prices?.collateralPriceUsd || 1,
      contractsVersion: tradeInfo.contractsVersion,
    },

    // Build sub-contexts using dedicated builders
    borrowingV1: buildBorrowingV1ContextFromBuilder(
      globalTradingVariables,
      collateralIndex,
      additionalParams.currentBlock
    ),
    borrowingV2: buildBorrowingV2Context(
      globalTradingVariables,
      collateralIndex,
      trade.pairIndex,
      additionalParams.currentTimestamp
    ),
    funding: buildFundingContext(
      globalTradingVariables,
      collateralIndex,
      trade.pairIndex,
      additionalParams.currentTimestamp
    ),
    trading: buildTradingFeesContext(
      globalTradingVariables,
      trade.pairIndex,
      additionalParams.traderFeeMultiplier
    ),

    // Trade-specific data
    tradeData:
      tradeContainer.tradeFeesData && tradeContainer.liquidationParams
        ? {
            tradeFeesData: tradeContainer.tradeFeesData,
            liquidationParams: tradeContainer.liquidationParams,
            initialAccFees: tradeContainer.initialAccFees,
          }
        : undefined,
  };
};
