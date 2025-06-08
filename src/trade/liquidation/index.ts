/**
 * @dev Main export file for liquidation module
 */

import { ContractsVersion } from "../../contracts/types";
import {
  getTotalTradeLiqFeesCollateral,
  getBorrowingFee,
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
  // Extract legacy parameters from structured context
  const {
    currentPairPrice,
    additionalFeeCollateral,
    partialCloseMultiplier,
    beforeOpened,
  } = context.liquidationSpecific;

  // 1. Calculate liquidation fees
  const closingFee = getTotalTradeLiqFeesCollateral(
    trade.collateralIndex,
    trade.user,
    trade.pairIndex,
    trade.collateralAmount,
    {
      totalLiqCollateralFeeP:
        context.tradeData.liquidationParams?.endLiqThresholdP || 0.9,
      globalTradeFeeParams: context.trading.globalTradeFeeParams,
      traderFeeMultiplier: context.trading.traderFeeMultiplier,
    }
  );

  // 2. Calculate holding fees and realized PnL
  let holdingFeesTotal = 0;
  let totalRealizedPnlCollateral = 0;

  if (!beforeOpened && context.tradeData.tradeFeesData && currentPairPrice) {
    // V10 data available - calculate full holding fees
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
        initialAccFeesV1: context.tradeData.initialAccFeesV1,
      }
    );
    holdingFeesTotal = holdingFees.totalFeeCollateral;

    // Calculate total realized PnL (realized PnL minus realized trading fees)
    totalRealizedPnlCollateral =
      context.tradeData.tradeFeesData.realizedPnlCollateral -
      context.tradeData.tradeFeesData.realizedTradingFeesCollateral;
  } else if (
    !beforeOpened &&
    context.borrowingV1 &&
    context.tradeData.initialAccFeesV1
  ) {
    // Markets using v1 borrowing fees model
    holdingFeesTotal = getBorrowingFee(
      trade.collateralAmount * trade.leverage,
      trade.pairIndex,
      trade.long,
      context.tradeData.initialAccFeesV1,
      context.borrowingV1
    );
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

/**
 * @dev Simplified wrapper for getTradeLiquidationPrice
 * @dev Mirrors the contract's simplified overload
 * @param trade The trade to calculate liquidation price for
 * @param additionalFeeCollateral Additional fees to consider
 * @param currentPairPrice Current pair price
 * @param context Context with all required data
 * @returns Liquidation price
 */
export const getTradeLiquidationPriceSimple = (
  trade: Trade,
  additionalFeeCollateral: number,
  currentPairPrice: number,
  context: GetLiquidationPriceContext
): number => {
  // Build complete context with additional parameters
  const fullContext: GetLiquidationPriceContext = {
    ...context,
    liquidationSpecific: {
      ...context.liquidationSpecific,
      currentPairPrice,
      additionalFeeCollateral,
      partialCloseMultiplier: 1,
      beforeOpened: false,
      isCounterTrade: trade.isCounterTrade || false,
    },
  };

  return getLiquidationPrice(trade, fullContext);
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
