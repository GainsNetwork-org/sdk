/**
 * @dev PnL calculation module
 * @dev Provides functions matching v10 contract implementations
 */

import {
  Trade,
  TradeInfo,
  LiquidationParams,
  TradeContainer,
  Fee,
  GlobalTradeFeeParams,
  TradeFeesData,
} from "../types";
import { ComprehensivePnlResult } from "./types";
import {
  BorrowingFee,
  GetBorrowingFeeContext,
  getBorrowingFee,
} from "../fees/borrowing";
import { GetPairBorrowingFeeV2Context } from "../fees/borrowingV2";
import { buildBorrowingV2Context } from "../fees/borrowingV2/builder";
import { GetPairFundingFeeContext } from "../fees/fundingFees/pairContext";
import { buildFundingContext } from "../fees/fundingFees/builder";
import { buildBorrowingV1Context as buildBorrowingV1ContextFromBuilder } from "../fees/borrowing/builder";
import {
  getTotalTradeFeesCollateral,
  getTradePendingHoldingFeesCollateral,
} from "../fees/trading";
import {
  buildTradingFeesContext,
  TradingFeesSubContext,
} from "../fees/trading/builder";
import { getLiqPnlThresholdP } from "../liquidation";
import { ContractsVersion } from "../../contracts/types";
import { GlobalTradingVariablesType } from "src/backend/tradingVariables/types";

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
 * @dev Context for comprehensive PnL calculations with nested sub-contexts
 */
export type GetComprehensivePnlContext = {
  // Core shared context
  core: {
    currentBlock: number;
    currentTimestamp: number;
    collateralPriceUsd: number;
    contractsVersion: ContractsVersion;
  };

  // Fee contexts using canonical types
  borrowingV1?: GetBorrowingFeeContext;
  borrowingV2?: GetPairBorrowingFeeV2Context;
  funding?: GetPairFundingFeeContext;
  trading: TradingFeesSubContext; // This one is fine, defined in builder

  // Trade-specific data
  tradeData?: {
    tradeFeesData: TradeFeesData;
    liquidationParams: LiquidationParams;
  };
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

  // Calculate holding fees - always use getTradePendingHoldingFeesCollateral
  // This mirrors the contract's getTradeValueCollateral which always calls this function
  const pendingHoldingFees = getTradePendingHoldingFeesCollateral(
    trade,
    tradeInfo,
    context.tradeData?.tradeFeesData || {
      realizedTradingFeesCollateral: 0,
      realizedPnlCollateral: 0,
      manuallyRealizedNegativePnlCollateral: 0,
      alreadyTransferredNegativePnlCollateral: 0,
      virtualAvailableCollateralInDiamond: 0,
      initialAccFundingFeeP: 0,
      initialAccBorrowingFeeP: 0,
    },
    currentPrice,
    {
      contractsVersion: context.core.contractsVersion,
      currentTimestamp: context.core.currentTimestamp,
      collateralPriceUsd: context.core.collateralPriceUsd,
      borrowingV1: context.borrowingV1,
      borrowingV2: context.borrowingV2,
      funding: context.funding,
    }
  );

  const borrowingFeeV1 = pendingHoldingFees.borrowingFeeCollateral_old;
  const borrowingFeeV2 = pendingHoldingFees.borrowingFeeCollateral;
  const fundingFee = pendingHoldingFees.fundingFeeCollateral;

  // Calculate closing fees
  const closingFee = getTotalTradeFeesCollateral(
    trade.collateralIndex,
    trade.user,
    trade.pairIndex,
    positionSizeCollateral,
    trade.isCounterTrade || false,
    {
      fee: context.trading.fee,
      globalTradeFeeParams: context.trading.globalTradeFeeParams,
      collateralPriceUsd: context.core.collateralPriceUsd,
      traderFeeMultiplier: context.trading.traderFeeMultiplier,
    }
  );

  // Total fees
  const totalFees = borrowingFeeV1 + borrowingFeeV2 + fundingFee + closingFee;

  // Check liquidation
  const liquidationThreshold = context.tradeData?.liquidationParams
    ? getLiqPnlThresholdP(context.tradeData.liquidationParams, trade.leverage) *
      -100
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

  // Calculate unrealized PnL (before closing fee, after holding fees)
  const totalHoldingFees = borrowingFeeV1 + borrowingFeeV2 + fundingFee;
  const uPnlCollateral = pnlCollateral - totalHoldingFees;
  const uPnlPercent = (uPnlCollateral / trade.collateralAmount) * 100;

  // Realized PnL (after all fees including closing)
  const realizedPnlCollateral = pnlCollateral - totalFees;
  const realizedPnlPercent =
    (realizedPnlCollateral / trade.collateralAmount) * 100;

  return {
    // Core PnL values
    pnlPercent,
    pnlCollateral,
    tradeValue,

    // Unrealized PnL (after holding fees, before closing fee)
    uPnlCollateral,
    uPnlPercent,

    // Realized PnL (after all fees)
    realizedPnlCollateral,
    realizedPnlPercent,

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
export type GetPnlContext = {
  currentBlock: number;
  groups: BorrowingFee.Group[];
  pairs: BorrowingFee.Pair[];
  collateralPriceUsd: number | undefined;
  contractsVersion: ContractsVersion | undefined;
  feeMultiplier: number | undefined;
  fee: Fee;
  globalTradeFeeParams: GlobalTradeFeeParams;
  traderFeeMultiplier?: number;
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

  if (
    useFees &&
    context.pairs &&
    context.groups &&
    context.currentBlock !== undefined &&
    context.collateralPriceUsd !== undefined
  ) {
    pnlCollat -= getBorrowingFee(
      posCollat * trade.leverage,
      trade.pairIndex,
      trade.long,
      initialAccFees,
      {
        currentBlock: context.currentBlock,
        groups: context.groups,
        pairs: context.pairs,
        collateralPriceUsd: context.collateralPriceUsd,
      }
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
      {
        fee: context.fee,
        globalTradeFeeParams: context.globalTradeFeeParams,
        collateralPriceUsd: context.collateralPriceUsd || 1,
        traderFeeMultiplier: context.traderFeeMultiplier,
      }
    );
    pnlCollat -= closingFee;
    pnlPercentage = (pnlCollat / posCollat) * 100;
  }

  pnlPercentage = pnlPercentage < -100 ? -100 : pnlPercentage;
  pnlCollat = (posCollat * pnlPercentage) / 100;

  return [pnlCollat, pnlPercentage];
};

/**
 * @dev Builds a complete context for comprehensive PnL calculations
 * @dev Uses sub-context builders to create properly scoped contexts
 * @param globalTradingVariables The transformed global trading variables from backend
 * @param trade The trade to calculate PnL for
 * @param tradeInfo Trade info with version and timestamps
 * @param tradeContainer Full trade container with fees data and liquidation params
 * @param additionalParams Additional parameters not available in trading variables
 * @returns Complete context ready for getComprehensivePnl
 */
export const buildComprehensivePnlContext = (
  globalTradingVariables: GlobalTradingVariablesType,
  trade: Trade,
  tradeInfo: TradeInfo,
  tradeContainer: TradeContainer,
  additionalParams: {
    currentBlock: number;
    currentTimestamp: number;
    traderFeeMultiplier?: number;
  }
): GetComprehensivePnlContext => {
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
          }
        : undefined,
  };
};

/**
 * @dev Calculates the price needed to achieve a target PnL percentage
 * @param targetPnlPercent The target PnL percentage (e.g., 50 for 50% profit, -25 for 25% loss)
 * @param trade The trade to calculate for
 * @param tradeInfo Trade info with timestamps
 * @param context Context with fee calculation parameters
 * @param netPnl Whether to include closing fees in the calculation
 * @returns The price that would result in the target PnL percentage
 */
export const getPriceForTargetPnlPercentage = (
  targetPnlPercent: number,
  trade: Trade,
  tradeInfo: TradeInfo,
  context: GetComprehensivePnlContext,
  netPnl = false
): number => {
  const { leverage, openPrice, long, collateralAmount } = trade;
  const positionSizeCollateral = collateralAmount * leverage;

  // Calculate holding fees - always use getTradePendingHoldingFeesCollateral
  // This mirrors the contract's getTradeValueCollateral which always calls this function
  const fees = getTradePendingHoldingFeesCollateral(
    trade,
    tradeInfo,
    context.tradeData?.tradeFeesData || {
      realizedTradingFeesCollateral: 0,
      realizedPnlCollateral: 0,
      manuallyRealizedNegativePnlCollateral: 0,
      alreadyTransferredNegativePnlCollateral: 0,
      virtualAvailableCollateralInDiamond: 0,
      initialAccFundingFeeP: 0,
      initialAccBorrowingFeeP: 0,
    },
    openPrice, // Use open price as a baseline
    {
      contractsVersion: context.core.contractsVersion,
      currentTimestamp: context.core.currentTimestamp,
      collateralPriceUsd: context.core.collateralPriceUsd,
      borrowingV1: context.borrowingV1,
      borrowingV2: context.borrowingV2,
      funding: context.funding,
    }
  );

  const totalHoldingFees =
    fees.fundingFeeCollateral +
    fees.borrowingFeeCollateral +
    fees.borrowingFeeCollateral_old;

  const targetPnlInCollateral = (collateralAmount * targetPnlPercent) / 100;
  let targetPnlGross = targetPnlInCollateral + totalHoldingFees;

  if (netPnl) {
    // Include closing fees
    const closingFee = getTotalTradeFeesCollateral(
      trade.collateralIndex,
      trade.user,
      trade.pairIndex,
      positionSizeCollateral,
      trade.isCounterTrade || false,
      {
        fee: context.trading.fee,
        globalTradeFeeParams: context.trading.globalTradeFeeParams,
        collateralPriceUsd: context.core.collateralPriceUsd,
        traderFeeMultiplier: context.trading.traderFeeMultiplier,
      }
    );
    targetPnlGross += closingFee;
  }

  // Calculate the price
  let price: number;
  if (long) {
    price = openPrice + (targetPnlGross * openPrice) / positionSizeCollateral;
  } else {
    price = openPrice - (targetPnlGross * openPrice) / positionSizeCollateral;
  }

  return price;
};

// Re-export types
export * from "./types";
export * from "./converter";
