/**
 * @dev Main export file for liquidation module
 */

import { ContractsVersion } from "../../contracts/types";
import {
  getTotalTradeLiqFeesCollateral,
  getBorrowingFee,
  getTradePendingHoldingFeesCollateral,
  Trade,
  TradeInfo,
  Fee,
  BorrowingFee,
  getSpreadP,
  LiquidationParams,
} from "..";
import { GetLiquidationPriceContext } from "./types";

export const getLiquidationPrice = (
  trade: Trade,
  fee: Fee,
  initialAccFees: BorrowingFee.InitialAccFees,
  context: GetLiquidationPriceContext
): number => {
  // Ensure initialAccFees is in context
  if (!context.initialAccFees) {
    context = { ...context, initialAccFees };
  }

  // 1. Calculate liquidation fees
  const closingFee = getTotalTradeLiqFeesCollateral(
    0, // collateralIndex not used in calculation
    trade.user,
    trade.pairIndex,
    trade.collateralAmount,
    context
  );

  // 2. Calculate holding fees and realized PnL
  let holdingFeesTotal = 0;
  let totalRealizedPnlCollateral = 0;

  if (
    !context.beforeOpened &&
    context.tradeFeesData &&
    context.currentPairPrice
  ) {
    // V10 data available - calculate full holding fees
    // Create a minimal tradeInfo from context
    const tradeInfo: TradeInfo = {
      contractsVersion: context.contractsVersion ?? ContractsVersion.V10,
      createdBlock: 0,
      tpLastUpdatedBlock: 0,
      slLastUpdatedBlock: 0,
      maxSlippageP: 0,
      lastOiUpdateTs: 0,
      collateralPriceUsd: context.collateralPriceUsd ?? 0,
      lastPosIncreaseBlock: 0,
    };

    const holdingFees = getTradePendingHoldingFeesCollateral(
      trade,
      tradeInfo,
      context.tradeFeesData,
      context.currentPairPrice,
      context
    );
    holdingFeesTotal = holdingFees.totalFeeCollateral;

    // Calculate total realized PnL (realized PnL minus realized trading fees)
    totalRealizedPnlCollateral =
      context.tradeFeesData.realizedPnlCollateral -
      context.tradeFeesData.realizedTradingFeesCollateral;
  } else if (!context.beforeOpened) {
    // Markets using v1 borrowing fees model
    holdingFeesTotal = getBorrowingFee(
      trade.collateralAmount * trade.leverage,
      trade.pairIndex,
      trade.long,
      initialAccFees,
      context
    );
  }

  // 3. Apply unified formula for all trades
  const partialCloseMultiplier = context.partialCloseMultiplier ?? 1;
  const additionalFeeCollateral = context.additionalFeeCollateral ?? 0;

  const totalFeesCollateral =
    closingFee +
    (holdingFeesTotal - totalRealizedPnlCollateral) * partialCloseMultiplier +
    additionalFeeCollateral;

  // 4. Calculate liquidation threshold
  const liqThresholdP = getLiqPnlThresholdP(
    context.liquidationParams,
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
    context?.contractsVersion !== undefined &&
    context.contractsVersion >= ContractsVersion.V9_2 &&
    ((context?.liquidationParams?.maxLiqSpreadP !== undefined &&
      context.liquidationParams.maxLiqSpreadP > 0) ||
      (context?.userPriceImpact?.fixedSpreadP !== undefined &&
        context.userPriceImpact.fixedSpreadP > 0))
  ) {
    const closingSpreadP = getSpreadP(
      context.pairSpreadP,
      true,
      context.liquidationParams,
      context.userPriceImpact
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
