/**
 * @dev Types for PnL calculations
 */

import { ContractsVersion } from "src/contracts/types";
import {
  BorrowingFee,
  GetBorrowingFeeContext,
  TradingFeesSubContext,
} from "../fees";
import { GetPairBorrowingFeeV2Context } from "../fees/borrowingV2";
import { GetPairFundingFeeContext } from "../fees/fundingFees";
import { TradeFeesData, LiquidationParams } from "../types";

/**
 * @dev Result of trade value calculation
 */
export type TradeValueResult = {
  tradeValue: number;
  pnlPercent: number;
  pnlCollateral: number;
  totalFees: number;
};

/**
 * @dev Detailed fee breakdown
 */
export type FeeBreakdown = {
  borrowingV1: number;
  borrowingV2: number;
  funding: number;
  closing: number;
  opening?: number;
  total: number;
};

/**
 * @dev Price impact breakdown for v10
 */
export type PriceImpactBreakdown = {
  fixedSpread: number;
  skewImpact: number;
  cumulVolImpact: number;
  total: number;
  priceAfterImpact: number;
};

/**
 * @dev Comprehensive PnL result with all details
 */
export type ComprehensivePnlResult = {
  // Raw PnL values (using market price, no price impact)
  pnlPercent: number;
  pnlCollateral: number;

  // Impact-adjusted PnL values (using execution price)
  impactPnlPercent: number;
  impactPnlCollateral: number;

  // Price impact
  priceImpact: {
    percent: number;
    collateral: number;
  };

  // Trade value (what trader would receive if closing)
  tradeValue: number;

  // Unrealized PnL (after holding fees, before closing fee, using market price)
  // This is PnL #2 - what trader sees for open positions
  uPnlCollateral: number;
  uPnlPercent: number;

  // Realized PnL (after all fees, using execution price)
  // This is PnL #6 - what trader would get if closing now
  realizedPnlCollateral: number;
  realizedPnlPercent: number;

  // Fee breakdown
  fees: FeeBreakdown;

  // Status flags
  isLiquidated: boolean;
  isProfitable: boolean;
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
  trading: TradingFeesSubContext;

  // Trade-specific data
  tradeData?: {
    tradeFeesData: TradeFeesData;
    liquidationParams: LiquidationParams;
    initialAccFees?: BorrowingFee.InitialAccFees;
  };
};
