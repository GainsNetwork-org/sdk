/**
 * @dev Liquidation price context builder module
 * @dev Provides builder functions for creating liquidation price contexts
 */

import { GlobalTradingVariablesType } from "../../backend/tradingVariables/types";
import { TradeContainer, UserPriceImpact } from "../types";
import { buildBorrowingV1Context } from "../fees/borrowing/builder";
import { buildBorrowingV2Context } from "../fees/borrowingV2/builder";
import { buildFundingContext } from "../fees/fundingFees/builder";
import { buildTradingFeesContext } from "../fees/trading/builder";
import { GetLiquidationPriceContext } from "./types";

/**
 * @dev Builds a complete context for liquidation price calculations
 * @param globalTradingVariables The transformed global trading variables from backend
 * @param tradeContainer Full trade container with trade, tradeInfo, fees data and liquidation params
 * @param additionalParams Additional parameters not available in trading variables
 * @returns Complete context ready for getLiquidationPrice
 */
export const buildLiquidationPriceContext = (
  globalTradingVariables: GlobalTradingVariablesType,
  tradeContainer: TradeContainer,
  additionalParams: {
    currentBlock: number;
    currentTimestamp: number;
    currentPairPrice: number;
    spreadP: number;
    traderFeeMultiplier?: number;
    additionalFeeCollateral?: number;
    partialCloseMultiplier?: number;
    beforeOpened?: boolean;
    userPriceImpact?: UserPriceImpact;
  }
): GetLiquidationPriceContext => {
  const { trade, tradeInfo } = tradeContainer;
  const collateralIndex = trade.collateralIndex || 1;
  const collateral = globalTradingVariables.collaterals[collateralIndex - 1];

  if (!tradeContainer.liquidationParams) {
    throw new Error(
      "Liquidation params are required for liquidation price calculation"
    );
  }

  return {
    // Core shared context
    core: {
      currentBlock: additionalParams.currentBlock,
      currentTimestamp: additionalParams.currentTimestamp,
      collateralPriceUsd: collateral.prices?.collateralPriceUsd || 1,
      contractsVersion: tradeInfo.contractsVersion,
      spreadP: additionalParams.spreadP,
    },

    // Build sub-contexts using dedicated builders
    borrowingV1: buildBorrowingV1Context(
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
    tradeData: {
      tradeInfo,
      tradeFeesData: tradeContainer.tradeFeesData!,
      liquidationParams: tradeContainer.liquidationParams,
      initialAccFeesV1: tradeContainer.initialAccFees,
    },

    // Additional parameters for liquidation calculation
    liquidationSpecific: {
      currentPairPrice: additionalParams.currentPairPrice,
      additionalFeeCollateral: additionalParams.additionalFeeCollateral || 0,
      partialCloseMultiplier: additionalParams.partialCloseMultiplier || 1,
      beforeOpened: additionalParams.beforeOpened || false,
      isCounterTrade: trade.isCounterTrade || false,
      userPriceImpact: additionalParams.userPriceImpact,
    },
  };
};
