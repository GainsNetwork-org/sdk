/**
 * @dev PnL calculation module
 * @dev Provides functions matching v10 contract implementations
 */

import { Trade, TradeInfo, LiquidationParams } from "../types";
import { ComprehensivePnlResult } from "./types";
import { getBorrowingFee, GetBorrowingFeeContext, BorrowingFee } from "../fees";
import { getTradeBorrowingFeesCollateral as getBorrowingFeeV2 } from "../fees/borrowingV2";
import { getTradeFundingFeesCollateral } from "../fees/fundingFees";
import {
  getTotalTradeFeesCollateral,
  GetTradeFeesContext,
  getTradePendingHoldingFeesCollateral,
} from "../fees/trading";
import { getLiqPnlThresholdP } from "../liquidation";
import { ContractsVersion } from "../../contracts/types";

/**
 * @dev Calculates PnL percentage for a position
 * @dev Mirrors contract's getPnlPercent function
 * @param openPrice Trade open price
 * @param currentPrice Current market price
 * @param long Whether position is long
 * @param leverage Position leverage
 * @returns PnL percentage (e.g., 10 = 10% profit, -50 = 50% loss)
 */
export const getPnlPercent = (
  openPrice: number,
  currentPrice: number,
  long: boolean,
  leverage: number
): number => {
  if (openPrice === 0) return -100;

  const priceDiff = long ? currentPrice - openPrice : openPrice - currentPrice;

  const pnlPercent = (priceDiff / openPrice) * 100 * leverage;

  // Cap at -100% loss
  return Math.max(pnlPercent, -100);
};

/**
 * @dev Calculates trade value from collateral and PnL
 * @dev Mirrors contract's getTradeValuePure function
 * @param collateral Trade collateral amount
 * @param pnlPercent PnL percentage
 * @param totalFees Total fees to deduct
 * @returns Trade value after PnL and fees
 */
export const getTradeValue = (
  collateral: number,
  pnlPercent: number,
  totalFees: number
): number => {
  const pnlCollateral = collateral * (pnlPercent / 100);
  const value = collateral + pnlCollateral - totalFees;
  return Math.max(0, value);
};

/**
 * @dev Context for comprehensive PnL calculations
 */
export type GetComprehensivePnlContext = GetBorrowingFeeContext &
  GetTradeFeesContext & {
    // Required context
    collateralPriceUsd: number;
    contractsVersion: ContractsVersion;
    currentTimestamp: number;

    // V1 borrowing fees
    initialAccFees?: BorrowingFee.InitialAccFees;

    // V2 borrowing fees
    borrowingProviderContext?: any;

    // Funding fees context
    fundingParams?: any;
    fundingData?: any;
    pairOiAfterV10?: any;
    netExposureToken?: any;
    netExposureUsd?: any;

    // Trade fees data
    tradeFeesData?: {
      initialAccFundingFeeP: number;
      initialAccBorrowingFeeP: number;
      realizedPnlCollateral: number;
      realizedTradingFeesCollateral: number;
      manuallyRealizedNegativePnlCollateral?: number;
      alreadyTransferredNegativePnlCollateral?: number;
      virtualAvailableCollateralInDiamond?: number;
    };

    // Liquidation params
    liquidationParams?: LiquidationParams;
  };

/**
 * @dev Comprehensive PnL calculation including all fees
 * @param trade The trade to calculate PnL for
 * @param currentPrice Current market price
 * @param tradeInfo Trade info with version and timestamps
 * @param context Context with all fee parameters
 * @returns Detailed PnL breakdown
 */
export const getComprehensivePnl = (
  trade: Trade,
  currentPrice: number,
  tradeInfo: TradeInfo,
  context: GetComprehensivePnlContext
): ComprehensivePnlResult => {
  // Calculate base PnL percentage
  let pnlPercent = getPnlPercent(
    trade.openPrice,
    currentPrice,
    trade.long,
    trade.leverage
  );

  // Calculate position size
  const positionSizeCollateral = trade.collateralAmount * trade.leverage;

  // Initialize fees
  let borrowingFeeV1 = 0;
  let borrowingFeeV2 = 0;
  let fundingFee = 0;

  // Calculate holding fees based on version
  if (
    context.contractsVersion >= ContractsVersion.V10 &&
    context.tradeFeesData
  ) {
    // V10: Use aggregated holding fees function
    const holdingFees = getTradePendingHoldingFeesCollateral(
      trade,
      tradeInfo,
      context.tradeFeesData as any, // Cast to handle partial type
      currentPrice,
      context
    );

    fundingFee = holdingFees.fundingFeeCollateral;
    borrowingFeeV2 = holdingFees.borrowingFeeCollateral;
    borrowingFeeV1 = holdingFees.borrowingFeeCollateral_old;
  } else {
    // Pre-v10: Calculate fees individually
    // V1 borrowing fees (still used by some markets)
    if (context.initialAccFees) {
      borrowingFeeV1 = getBorrowingFee(
        positionSizeCollateral,
        trade.pairIndex,
        trade.long,
        context.initialAccFees,
        context
      );
    }

    // V2 borrowing fees
    if (context.tradeFeesData && context.borrowingProviderContext) {
      borrowingFeeV2 = getBorrowingFeeV2(
        {
          positionSizeCollateral,
          openPrice: trade.openPrice,
          collateralIndex: trade.collateralIndex,
          pairIndex: trade.pairIndex,
          currentPairPrice: currentPrice,
          initialAccBorrowingFeeP:
            context.tradeFeesData.initialAccBorrowingFeeP,
          currentTimestamp: context.currentTimestamp,
        },
        context.borrowingProviderContext
      );
    }

    // Funding fees (v10+)
    if (
      context.contractsVersion >= ContractsVersion.V10 &&
      context.tradeFeesData
    ) {
      fundingFee = getTradeFundingFeesCollateral(
        trade,
        tradeInfo,
        context.tradeFeesData as any, // Cast to handle partial type
        currentPrice,
        context as any
      );
    }
  }

  // Calculate closing fees
  const closingFee = getTotalTradeFeesCollateral(
    trade.collateralIndex,
    trade.user,
    trade.pairIndex,
    positionSizeCollateral,
    trade.isCounterTrade || false,
    context
  );

  // Total fees
  const totalFees = borrowingFeeV1 + borrowingFeeV2 + fundingFee + closingFee;

  // Check liquidation
  const liquidationThreshold = context.liquidationParams
    ? getLiqPnlThresholdP(context.liquidationParams, trade.leverage) * -100
    : -90; // Default 90% loss

  const isLiquidated = pnlPercent <= liquidationThreshold;

  // If liquidated, set PnL to -100%
  if (isLiquidated) {
    pnlPercent = -100;
  }

  // Calculate final trade value
  const tradeValue = getTradeValue(
    trade.collateralAmount,
    pnlPercent,
    totalFees
  );

  // Calculate PnL in collateral
  const pnlCollateral = trade.collateralAmount * (pnlPercent / 100);

  // Calculate leveraged position size
  const leveragedPositionSize = trade.collateralAmount * trade.leverage;

  // Calculate net PnL after fees
  const netPnlAfterFees = pnlCollateral - totalFees;

  return {
    // Core PnL values
    pnlPercent,
    pnlCollateral,
    tradeValue,

    // Fee breakdown
    fees: {
      borrowingV1: borrowingFeeV1,
      borrowingV2: borrowingFeeV2,
      funding: fundingFee,
      closing: closingFee,
      total: totalFees,
    },

    // Status flags
    isLiquidated,
    isProfitable: pnlPercent > 0,

    // Additional info
    leveragedPositionSize,
    netPnlAfterFees,
  };
};

/**
 * @dev Legacy getPnl function for backward compatibility
 * @deprecated Use getComprehensivePnl for new implementations
 */
export type GetPnlContext = GetBorrowingFeeContext &
  GetTradeFeesContext & {
    collateralPriceUsd: number | undefined;
    contractsVersion: ContractsVersion | undefined;
    feeMultiplier: number | undefined;
  };

/**
 * @dev Legacy PnL calculation function
 * @deprecated Use getComprehensivePnl for more comprehensive calculations
 * @param price Current price
 * @param trade Trade object
 * @param tradeInfo Trade info (not used in legacy implementation)
 * @param initialAccFees Initial accumulated fees
 * @param liquidationParams Liquidation parameters
 * @param useFees Whether to include fees
 * @param context Context with fee calculation parameters
 * @returns [pnlCollateral, pnlPercentage] or undefined if no price
 */
export const getPnl = (
  price: number | undefined,
  trade: Trade,
  _tradeInfo: TradeInfo,
  initialAccFees: BorrowingFee.InitialAccFees,
  liquidationParams: LiquidationParams,
  useFees: boolean,
  context: GetPnlContext
): number[] | undefined => {
  if (!price) {
    return;
  }
  const posCollat = trade.collateralAmount;
  const { openPrice, leverage } = trade;

  let pnlCollat = trade.long
    ? ((price - openPrice) / openPrice) * leverage * posCollat
    : ((openPrice - price) / openPrice) * leverage * posCollat;

  if (useFees) {
    pnlCollat -= getBorrowingFee(
      posCollat * trade.leverage,
      trade.pairIndex,
      trade.long,
      initialAccFees,
      context as GetBorrowingFeeContext
    );
  }

  let pnlPercentage = (pnlCollat / posCollat) * 100;

  // Can be liquidated
  if (
    pnlPercentage <=
    getLiqPnlThresholdP(liquidationParams, leverage) * -100
  ) {
    pnlPercentage = -100;
  } else {
    // Calculate closing fee using the same function as opening fees
    const positionSizeCollateral = posCollat * trade.leverage;
    const closingFee = getTotalTradeFeesCollateral(
      0, // collateralIndex not used
      trade.user,
      trade.pairIndex,
      positionSizeCollateral,
      trade.isCounterTrade ?? false,
      context
    );
    pnlCollat -= closingFee;
    pnlPercentage = (pnlCollat / posCollat) * 100;
  }

  pnlPercentage = pnlPercentage < -100 ? -100 : pnlPercentage;
  pnlCollat = (posCollat * pnlPercentage) / 100;

  return [pnlCollat, pnlPercentage];
};

// Re-export types
export * from "./types";
export * from "./converter";
