/**
 * @dev PnL calculation module
 * @dev Provides functions matching v10 contract implementations
 */

import {
  Trade,
  TradeInfo,
  LiquidationParams,
  Fee,
  GlobalTradeFeeParams,
  TradeFeesData,
} from "../types";
import { ComprehensivePnlResult, GetComprehensivePnlContext } from "./types";
import { BorrowingFee, getBorrowingFee } from "../fees/borrowing";
import {
  getTotalTradeFeesCollateral,
  getTradePendingHoldingFeesCollateral,
} from "../fees/trading";
import { getLiqPnlThresholdP } from "../liquidation";
import { ContractsVersion } from "../../contracts/types";

/**
 * @dev Gets trade realized PnL components from TradeFeesData
 * @dev Mirrors contract's getTradeRealizedPnlCollateral function
 * @param tradeFeesData Trade fees data containing realized components
 * @returns Tuple of [realizedPnlCollateral, realizedTradingFeesCollateral, totalRealizedPnlCollateral]
 */
export const getTradeRealizedPnlCollateral = (
  tradeFeesData: TradeFeesData
): {
  realizedPnlCollateral: number;
  realizedTradingFeesCollateral: number;
  totalRealizedPnlCollateral: number;
} => {
  const realizedPnlCollateral = tradeFeesData.realizedPnlCollateral;
  const realizedTradingFeesCollateral =
    tradeFeesData.realizedTradingFeesCollateral;
  const totalRealizedPnlCollateral =
    realizedPnlCollateral - realizedTradingFeesCollateral;

  return {
    realizedPnlCollateral,
    realizedTradingFeesCollateral,
    totalRealizedPnlCollateral,
  };
};

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
 * @dev Comprehensive PnL calculation including all fees
 * @param trade The trade to calculate PnL for
 * @param marketPrice Current market price (without price impact)
 * @param executionPrice Price after all impacts (spread, skew, volume)
 * @param tradeInfo Trade info with version and timestamps
 * @param context Context with all fee parameters
 * @returns Detailed PnL breakdown
 */
export const getComprehensivePnl = (
  trade: Trade,
  marketPrice: number,
  executionPrice: number,
  tradeInfo: TradeInfo,
  context: GetComprehensivePnlContext
): ComprehensivePnlResult => {
  // Calculate both raw PnL (market price) and impact-adjusted PnL (execution price)
  let rawPnlPercent = getPnlPercent(
    trade.openPrice,
    marketPrice,
    trade.long,
    trade.leverage
  );

  let impactPnlPercent = getPnlPercent(
    trade.openPrice,
    executionPrice,
    trade.long,
    trade.leverage
  );

  if (!context.tradeData) {
    throw new Error("Trade data is undefined");
  }

  // Calculate position size
  const positionSizeCollateral = trade.collateralAmount * trade.leverage;

  // Calculate holding fees - always use getTradePendingHoldingFeesCollateral
  const pendingHoldingFees = getTradePendingHoldingFeesCollateral(
    trade,
    tradeInfo,
    context.tradeData.tradeFeesData,
    executionPrice,
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
  const totalHoldingFees = borrowingFeeV1 + borrowingFeeV2 + fundingFee;
  const totalFees = totalHoldingFees + closingFee;

  // Check liquidation (using raw PnL for liquidation check)
  const liquidationThreshold = context.tradeData?.liquidationParams
    ? getLiqPnlThresholdP(context.tradeData.liquidationParams, trade.leverage) *
      -100
    : -90; // Default 90% loss

  const isLiquidated = rawPnlPercent <= liquidationThreshold;

  // If liquidated, set both PnL percentages to -100%
  if (isLiquidated) {
    rawPnlPercent = -100;
    impactPnlPercent = -100;
  }

  // Get realized PnL components from TradeFeesData
  const { totalRealizedPnlCollateral } = getTradeRealizedPnlCollateral(
    context.tradeData.tradeFeesData
  );

  // Calculate raw PnL in collateral (using market price)
  const rawPnlCollateral = trade.collateralAmount * (rawPnlPercent / 100);

  // Calculate impact-adjusted PnL in collateral (using execution price)
  const impactPnlCollateral = trade.collateralAmount * (impactPnlPercent / 100);

  // Calculate price impact
  const priceImpactCollateral = impactPnlCollateral - rawPnlCollateral;
  const priceImpactPercent = impactPnlPercent - rawPnlPercent;

  // Calculate unrealized PnL (before closing fee, after holding fees, using market price)
  // This is what the trader sees for open positions
  const uPnlCollateral =
    rawPnlCollateral - totalHoldingFees + totalRealizedPnlCollateral;
  const uPnlPercent = (uPnlCollateral / trade.collateralAmount) * 100;

  // Calculate realized PnL (after all fees including closing, using execution price)
  // This is what the trader would get if closing the position
  const realizedPnlCollateral =
    impactPnlCollateral - totalFees + totalRealizedPnlCollateral;
  const realizedPnlPercent =
    (realizedPnlCollateral / trade.collateralAmount) * 100;

  // Calculate trade value using execution price (what trader would receive)
  const tradeValue = getTradeValue(
    trade.collateralAmount,
    impactPnlPercent,
    totalFees
  );

  return {
    // Raw PnL values (using market price, no price impact)
    pnlPercent: rawPnlPercent,
    pnlCollateral: rawPnlCollateral,

    // Impact-adjusted PnL values (using execution price)
    impactPnlPercent,
    impactPnlCollateral,

    // Price impact
    priceImpact: {
      percent: priceImpactPercent,
      collateral: priceImpactCollateral,
    },

    // Trade value (what trader would receive if closing)
    tradeValue,

    // Unrealized PnL (after holding fees, before closing fee, using market price)
    // Use for open position display
    uPnlCollateral,
    uPnlPercent,

    // Realized PnL (after all fees, using execution price)
    // Use for closing preview
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
    isProfitable: rawPnlPercent > 0, // Based on raw PnL
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
      initialAccFees: context.tradeData?.initialAccFees,
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
export * from "./builder";
