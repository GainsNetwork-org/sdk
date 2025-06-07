/**
 * @dev PnL calculation module
 * @dev Provides functions matching v10 contract implementations
 */

import { Trade, TradeInfo, LiquidationParams, TradeContainer } from "../types";
import { ComprehensivePnlResult } from "./types";
import { getBorrowingFee, GetBorrowingFeeContext, BorrowingFee } from "../fees";
import { 
  getTradeBorrowingFeesCollateral as getBorrowingFeeV2,
  createCollateralScopedBorrowingContext,
  BorrowingFeeV2
} from "../fees/borrowingV2";
import { getTradeFundingFeesCollateral } from "../fees/fundingFees";
import {
  getTotalTradeFeesCollateral,
  GetTradeFeesContext,
  getTradePendingHoldingFeesCollateral,
} from "../fees/trading";
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
    borrowingProviderContext?: {
      params: BorrowingFeeV2.BorrowingFeeParams[];
      data: BorrowingFeeV2.PairBorrowingFeeData[];
    };

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
      // Create collateral-scoped context from the provider data
      const borrowingContext = createCollateralScopedBorrowingContext(
        context.borrowingProviderContext,
        context.currentTimestamp
      );
      
      borrowingFeeV2 = getBorrowingFeeV2(
        {
          positionSizeCollateral,
          openPrice: trade.openPrice,
          pairIndex: trade.pairIndex,
          currentPairPrice: currentPrice,
          initialAccBorrowingFeeP:
            context.tradeFeesData.initialAccBorrowingFeeP,
          currentTimestamp: context.currentTimestamp,
        },
        borrowingContext
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

  // Calculate unrealized PnL (before closing fee, after holding fees)
  const holdingFees = borrowingFeeV1 + borrowingFeeV2 + fundingFee;
  const uPnlCollateral = pnlCollateral - holdingFees;
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

/**
 * @todo should we add validation or?
 * @dev Builds a complete context for comprehensive PnL calculations
 * @dev Extracts all required data from global trading variables and trade information
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
  const { collaterals, pairs, fees, globalTradeFeeParams } =
    globalTradingVariables;

  const collateral = collaterals[(trade.collateralIndex || 1) - 1];

  // Extract borrowing fees data
  const { pairBorrowingFees, groupBorrowingFees, pairBorrowingFeesV2 } =
    collateral;

  // Extract funding fees data
  const { pairFundingFees } = collateral;

  // Build the comprehensive context
  return {
    // Core context
    currentBlock: additionalParams.currentBlock,
    collateralPriceUsd: collateral.prices?.collateralPriceUsd || 1,
    contractsVersion: tradeInfo.contractsVersion,
    currentTimestamp: additionalParams.currentTimestamp,

    // Borrowing fees v1
    groups: groupBorrowingFees,
    pairs: pairBorrowingFees,
    initialAccFees: tradeContainer.initialAccFees,

    // Trading fees
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    fee: fees![pairs![trade.pairIndex].feeIndex],
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    globalTradeFeeParams: globalTradeFeeParams!,
    traderFeeMultiplier: additionalParams.traderFeeMultiplier,

    // v10+ features
    tradeFeesData: tradeContainer.tradeFeesData,
    liquidationParams: tradeContainer.liquidationParams,

    // v2 borrowing fees
    borrowingProviderContext: pairBorrowingFeesV2,

    // Funding fees
    fundingParams: pairFundingFees?.params?.[trade.pairIndex],
    fundingData: pairFundingFees?.data?.[trade.pairIndex],
    pairOiAfterV10: collateral.pairOis?.[trade.pairIndex],
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

  // Calculate holding fees
  let holdingFees = 0;
  
  if (context.contractsVersion >= ContractsVersion.V10 && context.tradeFeesData) {
    // V10: Use aggregated holding fees
    const fees = getTradePendingHoldingFeesCollateral(
      trade,
      tradeInfo,
      context.tradeFeesData as any,
      openPrice, // Use open price as a baseline
      context
    );
    holdingFees = fees.fundingFeeCollateral + fees.borrowingFeeCollateral + fees.borrowingFeeCollateral_old;
  } else {
    // Pre-v10: Calculate fees individually
    if (context.initialAccFees) {
      holdingFees += getBorrowingFee(
        positionSizeCollateral,
        trade.pairIndex,
        trade.long,
        context.initialAccFees,
        context
      );
    }
    
    if (context.tradeFeesData && context.borrowingProviderContext) {
      // Create collateral-scoped context from the provider data
      const borrowingContext = createCollateralScopedBorrowingContext(
        context.borrowingProviderContext,
        context.currentTimestamp
      );
      
      holdingFees += getBorrowingFeeV2(
        {
          positionSizeCollateral,
          openPrice: trade.openPrice,
          pairIndex: trade.pairIndex,
          currentPairPrice: openPrice,
          initialAccBorrowingFeeP: context.tradeFeesData.initialAccBorrowingFeeP,
          currentTimestamp: context.currentTimestamp,
        },
        borrowingContext
      );
    }
    
    if (context.contractsVersion >= ContractsVersion.V10 && context.tradeFeesData) {
      holdingFees += getTradeFundingFeesCollateral(
        trade,
        tradeInfo,
        context.tradeFeesData as any,
        openPrice,
        context as any
      );
    }
  }

  const targetPnlInCollateral = (collateralAmount * targetPnlPercent) / 100;
  let targetPnlGross = targetPnlInCollateral + holdingFees;

  if (netPnl) {
    // Include closing fees
    const closingFee = getTotalTradeFeesCollateral(
      trade.collateralIndex,
      trade.user,
      trade.pairIndex,
      positionSizeCollateral,
      trade.isCounterTrade || false,
      context
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
