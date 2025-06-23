/**
 * @dev Main export file for liquidation module
 */

import { ContractsVersion } from "../../contracts/types";
import {
  getTotalTradeFeesCollateral,
  getTradePendingHoldingFeesCollateral,
  Trade,
  getSpreadP,
  LiquidationParams,
} from "..";
import { GetLiquidationPriceContext } from "./types";

/**
 * @dev Calculate liquidation price with structured context
 * @param trade The trade to calculate liquidation price for
 * @param context Structured context with all required data
 * @returns Liquidation price
 */
export const getLiquidationPrice = (
  trade: Trade,
  context: GetLiquidationPriceContext
): number => {
  // Extract parameters from structured context
  const {
    currentPairPrice,
    additionalFeeCollateral = 0,
    partialCloseMultiplier = 1,
    beforeOpened = false,
    isCounterTrade = false,
  } = context.liquidationSpecific;

  // 1. Calculate closing fees
  const closingFee = getTotalTradeFeesCollateral(
    trade.collateralIndex,
    "", // No fee tiers applied for liquidation calculation
    trade.pairIndex,
    trade.collateralAmount * trade.leverage,
    isCounterTrade,
    {
      fee: context.trading.fee,
      collateralPriceUsd: context.core.collateralPriceUsd,
      globalTradeFeeParams: context.trading.globalTradeFeeParams,
      traderFeeMultiplier: 1,
      counterTradeSettings: context.trading.counterTradeSettings,
    }
  );

  // 2. Calculate holding fees and realized PnL for opened trades
  let holdingFeesTotal = 0;
  let totalRealizedPnlCollateral = 0;

  if (!beforeOpened) {
    // Calculate holding fees
    const holdingFees = getTradePendingHoldingFeesCollateral(
      trade,
      context.tradeData.tradeInfo,
      context.tradeData.tradeFeesData,
      currentPairPrice,
      {
        contractsVersion: context.core.contractsVersion,
        currentTimestamp: context.core.currentTimestamp,
        collateralPriceUsd: context.core.collateralPriceUsd,
        borrowingV1: context.borrowingV1,
        borrowingV2: context.borrowingV2,
        funding: context.funding,
        initialAccFees: context.tradeData.initialAccFees,
      }
    );
    holdingFeesTotal = holdingFees.totalFeeCollateral;

    // Calculate total realized PnL (realized PnL minus realized trading fees)
    totalRealizedPnlCollateral =
      context.tradeData.tradeFeesData.realizedPnlCollateral -
      context.tradeData.tradeFeesData.realizedTradingFeesCollateral;
  }

  // 3. Apply unified formula for all trades
  const totalFeesCollateral =
    closingFee +
    (holdingFeesTotal - totalRealizedPnlCollateral) * partialCloseMultiplier +
    additionalFeeCollateral;

  // 4. Calculate liquidation threshold
  const liqThresholdP = getLiqPnlThresholdP(
    context.tradeData.liquidationParams,
    trade.leverage
  );

  // 5. Calculate liquidation price distance
  const collateralLiqNegativePnl = trade.collateralAmount * liqThresholdP;

  let liqPriceDistance =
    (trade.openPrice * (collateralLiqNegativePnl - totalFeesCollateral)) /
    trade.collateralAmount /
    trade.leverage;

  // 6. Apply closing spread for v9.2+
  if (
    context.core.contractsVersion >= ContractsVersion.V9_2 &&
    ((context.tradeData.liquidationParams?.maxLiqSpreadP !== undefined &&
      context.tradeData.liquidationParams.maxLiqSpreadP > 0) ||
      (context.liquidationSpecific.userPriceImpact?.fixedSpreadP !==
        undefined &&
        context.liquidationSpecific.userPriceImpact.fixedSpreadP > 0))
  ) {
    const closingSpreadP = getSpreadP(
      context.core.spreadP,
      true,
      context.tradeData.liquidationParams,
      context.liquidationSpecific.userPriceImpact
    );

    liqPriceDistance -= trade.openPrice * closingSpreadP;
  }

  // 7. Calculate final liquidation price
  return trade.long
    ? Math.max(trade.openPrice - liqPriceDistance, 0)
    : Math.max(trade.openPrice + liqPriceDistance, 0);
};

export const getLiqPnlThresholdP = (
  liquidationParams: LiquidationParams | undefined,
  leverage: number | undefined
): number => {
  if (
    liquidationParams === undefined ||
    leverage === undefined ||
    liquidationParams.maxLiqSpreadP === 0 ||
    liquidationParams.startLiqThresholdP === 0 ||
    liquidationParams.endLiqThresholdP === 0 ||
    liquidationParams.startLeverage === 0 ||
    liquidationParams.endLeverage === 0
  ) {
    return 0.9;
  }

  if (leverage < liquidationParams.startLeverage) {
    return liquidationParams.startLiqThresholdP;
  }

  if (leverage > liquidationParams.endLeverage) {
    return liquidationParams.endLiqThresholdP;
  }

  if (
    liquidationParams.startLiqThresholdP === liquidationParams.endLiqThresholdP
  ) {
    return liquidationParams.endLiqThresholdP;
  }

  return (
    liquidationParams.startLiqThresholdP -
    ((leverage - liquidationParams.startLeverage) *
      (liquidationParams.startLiqThresholdP -
        liquidationParams.endLiqThresholdP)) /
      (liquidationParams.endLeverage - liquidationParams.startLeverage)
  );
};

// Converters
export {
  convertLiquidationParams,
  convertLiquidationParamsArray,
  encodeLiquidationParams,
} from "./converter";

// Types
export * from "./types";

// Builder
export * from "./builder";
