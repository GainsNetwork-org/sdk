/**
 * @dev Trading fee calculations for opening and closing positions
 */

import { Fee, PairIndex, Trade, TradeInfo, TradeFeesData } from "../../types";
import { getBorrowingFee, GetBorrowingFeeContext } from "../borrowing";
import * as BorrowingFee from "../borrowing/types";
import { getTradeBorrowingFeesCollateral as getTradeBorrowingFeesCollateralV2 } from "../borrowingV2";
import { GetPairBorrowingFeeV2Context } from "../borrowingV2";
import { getTradeFundingFeesCollateral } from "../fundingFees";
import { GetPairFundingFeeContext } from "../fundingFees/pairContext";
import { calculateFeeAmount } from "../tiers";
import {
  GetTradeFeesContext,
  GetLiquidationFeesContext,
  GetClosingFeeContext,
  TradeFeesBreakdown,
  TradeHoldingFees,
} from "./types";
import { ContractsVersion } from "../../../contracts/types";

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
 * @dev Context for holding fees calculation with structured sub-contexts
 */
export type GetStructuredHoldingFeesContext = {
  contractsVersion: ContractsVersion;
  currentTimestamp: number;
  collateralPriceUsd: number;
  borrowingV1?: GetBorrowingFeeContext;
  borrowingV2?: GetPairBorrowingFeeV2Context;
  funding?: GetPairFundingFeeContext;
  // TODO: Add initialAccFees for V1 borrowing fees
  // This is critical for accurate fee calculation and should come from
  // the BorrowingInitialAccFeesStored event when the trade was opened
  initialAccFeesV1?: BorrowingFee.InitialAccFees;
};

/**
 * @dev Calculates total holding fees for a trade (funding + borrowing fees)
 * @param trade The trade to calculate fees for
 * @param tradeInfo Trade info containing contracts version
 * @param tradeFeesData Trade fees data containing initial acc fees
 * @param currentPairPrice Current pair price
 * @param context Structured context with sub-contexts for each fee type
 * @returns Object containing all holding fee components
 */
export const getTradePendingHoldingFeesCollateral = (
  trade: Trade,
  tradeInfo: TradeInfo,
  tradeFeesData: TradeFeesData,
  currentPairPrice: number,
  context: GetStructuredHoldingFeesContext
): TradeHoldingFees => {
  const positionSizeCollateral = trade.collateralAmount * trade.leverage;

  // Calculate funding fees (v10+ only)
  let fundingFeeCollateral = 0;
  if (
    context.contractsVersion >= ContractsVersion.V10 &&
    context.funding &&
    tradeFeesData.initialAccFundingFeeP !== undefined
  ) {
    fundingFeeCollateral = getTradeFundingFeesCollateral(
      trade,
      tradeInfo,
      tradeFeesData,
      currentPairPrice,
      {
        ...context.funding,
        currentTimestamp: context.currentTimestamp,
      }
    );
  }

  // Calculate borrowing fees v2 (v10+ only)
  let borrowingFeeCollateral = 0;
  if (
    context.contractsVersion >= ContractsVersion.V10 &&
    context.borrowingV2 &&
    tradeFeesData.initialAccBorrowingFeeP !== undefined
  ) {
    borrowingFeeCollateral = getTradeBorrowingFeesCollateralV2(
      {
        positionSizeCollateral,
        openPrice: trade.openPrice,
        currentPairPrice,
        initialAccBorrowingFeeP: tradeFeesData.initialAccBorrowingFeeP,
        currentTimestamp: context.currentTimestamp,
      },
      context.borrowingV2
    );
  }

  // Calculate v1 borrowing fees (some markets use v1 indefinitely)
  let borrowingFeeCollateral_old = 0;
  if (context.borrowingV1 && context.initialAccFeesV1) {
    borrowingFeeCollateral_old = getBorrowingFee(
      positionSizeCollateral,
      trade.pairIndex,
      trade.long,
      context.initialAccFeesV1,
      context.borrowingV1
    );
  }

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
export * from "./builder";
