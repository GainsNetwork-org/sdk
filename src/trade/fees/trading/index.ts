/**
 * @dev Trading fee calculations for opening and closing positions
 */

import { Fee, PairIndex, Trade, TradeInfo, TradeFeesData } from "../../types";
import { calculateFeeAmount } from "../tiers";
import {
  GetTradeFeesContext,
  GetLiquidationFeesContext,
  GetClosingFeeContext,
  TradeFeesBreakdown,
  TradeHoldingFees,
} from "./types";
import { getTradeFundingFeesCollateral } from "../fundingFees";
import { getTradeBorrowingFeesCollateral as getTradeBorrowingFeesCollateralV2 } from "../borrowingV2";
import { getBorrowingFee } from "../borrowing";
import { ContractsVersion } from "../../../contracts/types";
import * as BorrowingFee from "../borrowing/types";

/**
 * @dev Returns the total fee for a trade in collateral tokens
 * @dev Mirrors the contract's getTotalTradeFeesCollateral function
 * @param collateralIndex Collateral index (not used in calculation, for consistency)
 * @param trader Trader address (for fee tier lookup)
 * @param pairIndex Index of the trading pair
 * @param positionSizeCollateral Position size in collateral tokens
 * @param isCounterTrade Whether the trade is a counter trade
 * @param context Context containing fee parameters and settings
 * @returns Total fee in collateral tokens
 */
export const getTotalTradeFeesCollateral = (
  collateralIndex: number,
  trader: string,
  pairIndex: PairIndex,
  positionSizeCollateral: number,
  isCounterTrade: boolean,
  context: GetTradeFeesContext
): number => {
  const { fee, collateralPriceUsd } = context;
  const { totalPositionSizeFeeP, minPositionSizeUsd } = fee;

  // Get counter trade fee rate multiplier (default 1 = 1x)
  const counterTradeFeeRateMultiplier =
    isCounterTrade && context.counterTradeSettings?.[pairIndex]
      ? context.counterTradeSettings[pairIndex].feeRateMultiplier
      : 1;

  // Apply counter trade multiplier to position size
  const adjustedPositionSizeCollateral =
    positionSizeCollateral * counterTradeFeeRateMultiplier;

  // Calculate minimum position size in collateral
  const minPositionSizeCollateral = minPositionSizeUsd / collateralPriceUsd;

  // Use max of adjusted position size and minimum position size
  const positionSizeBasis = Math.max(
    adjustedPositionSizeCollateral,
    minPositionSizeCollateral
  );

  // Calculate raw fee
  const rawFee = totalPositionSizeFeeP * positionSizeBasis;

  // Apply trader fee tier if available
  return calculateFeeAmount(trader, rawFee, context.traderFeeMultiplier);
};

/**
 * @dev Returns the fee breakdown for a trade
 * @dev Mirrors the contract's getTradeFeesCollateral function
 */
export const getTradeFeesCollateral = (
  collateralIndex: number,
  trader: string,
  pairIndex: PairIndex,
  positionSizeCollateral: number,
  isCounterTrade: boolean,
  context: GetTradeFeesContext
): TradeFeesBreakdown => {
  const totalFees = getTotalTradeFeesCollateral(
    collateralIndex,
    trader,
    pairIndex,
    positionSizeCollateral,
    isCounterTrade,
    context
  );

  const { globalTradeFeeParams } = context;
  const totalP =
    globalTradeFeeParams.referralFeeP +
    globalTradeFeeParams.govFeeP +
    globalTradeFeeParams.triggerOrderFeeP +
    globalTradeFeeParams.gnsOtcFeeP +
    globalTradeFeeParams.gTokenFeeP;

  // Distribute fees proportionally
  return {
    referralFeeCollateral:
      (totalFees * globalTradeFeeParams.referralFeeP) / totalP,
    govFeeCollateral: (totalFees * globalTradeFeeParams.govFeeP) / totalP,
    triggerFeeCollateral:
      (totalFees * globalTradeFeeParams.triggerOrderFeeP) / totalP,
    gnsOtcFeeCollateral: (totalFees * globalTradeFeeParams.gnsOtcFeeP) / totalP,
    gTokenFeeCollateral: (totalFees * globalTradeFeeParams.gTokenFeeP) / totalP,
  };
};

/**
 * @dev Returns total liquidation fee for a trade in collateral tokens
 * @dev Mirrors the contract's getTotalTradeLiqFeesCollateral function
 */
export const getTotalTradeLiqFeesCollateral = (
  collateralIndex: number,
  trader: string,
  pairIndex: PairIndex,
  collateralAmount: number,
  context: GetLiquidationFeesContext
): number => {
  const { totalLiqCollateralFeeP } = context;

  // Calculate raw liquidation fee
  const rawFee = collateralAmount * totalLiqCollateralFeeP;

  // Apply trader fee tier if available
  return calculateFeeAmount(trader, rawFee, context.traderFeeMultiplier);
};

/**
 * @dev Legacy function for backward compatibility
 * @deprecated Use getTotalTradeFeesCollateral instead
 */
export const getClosingFee = (
  collateralAmount: number,
  leverage: number,
  pairIndex: PairIndex,
  pairFee: Fee | undefined,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _collateralPriceUsd: number | undefined = 0, // Kept for backward compatibility
  isCounterTrade = false,
  trader?: string,
  context?: GetClosingFeeContext
): number => {
  if (!pairFee || !context) return 0;

  const positionSizeCollateral = collateralAmount * leverage;
  return getTotalTradeFeesCollateral(
    0, // collateralIndex not used
    trader || "",
    pairIndex,
    positionSizeCollateral,
    isCounterTrade,
    context
  );
};

/**
 * @dev Calculates total holding fees for a trade (funding + borrowing fees)
 * @param trade The trade to calculate fees for
 * @param tradeInfo Trade info containing contracts version
 * @param tradeFeesData Trade fees data containing initial acc fees
 * @param currentPairPrice Current pair price
 * @param context Context with fee parameters
 * @returns Object containing all holding fee components
 */
export const getTradePendingHoldingFeesCollateral = (
  trade: Trade,
  tradeInfo: TradeInfo,
  tradeFeesData: TradeFeesData,
  currentPairPrice: number,
  context: {
    contractsVersion?: ContractsVersion;
    currentBlock?: number;
    groups?: BorrowingFee.Group[];
    pairs?: BorrowingFee.Pair[];
    collateralPriceUsd?: number;
    initialAccFees?: BorrowingFee.InitialAccFees;
    [key: string]: any;
  }
): TradeHoldingFees => {
  // Calculate funding fees (v10+ only)
  const fundingFeeCollateral =
    (context.contractsVersion ?? tradeInfo.contractsVersion) >=
    ContractsVersion.V10
      ? getTradeFundingFeesCollateral(
          trade,
          tradeInfo,
          tradeFeesData,
          currentPairPrice,
          context as any
        )
      : 0;

  // Calculate borrowing fees v2
  const borrowingFeeCollateral = getTradeBorrowingFeesCollateralV2(
    {
      positionSizeCollateral: trade.collateralAmount * trade.leverage,
      openPrice: trade.openPrice,
      pairIndex: trade.pairIndex,
      currentPairPrice,
      initialAccBorrowingFeeP: tradeFeesData.initialAccBorrowingFeeP,
      currentTimestamp: context.currentTimestamp,
    },
    context as any
  );

  // Calculate v1 borrowing fees (some markets use v1 indefinitely)
  const borrowingFeeCollateral_old = getBorrowingFee(
    trade.collateralAmount * trade.leverage,
    trade.pairIndex,
    trade.long,
    context.initialAccFees || { accPairFee: 0, accGroupFee: 0, block: 0 }, // Use context initial fees or empty
    context as any
  );

  return {
    fundingFeeCollateral,
    borrowingFeeCollateral,
    borrowingFeeCollateral_old,
    totalFeeCollateral:
      fundingFeeCollateral +
      borrowingFeeCollateral +
      borrowingFeeCollateral_old,
  };
};

// Export types
export * from "./types";
export * from "./converter";
