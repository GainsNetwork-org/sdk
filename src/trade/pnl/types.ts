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
import { Trade, TradeInfo, TradeFeesData, LiquidationParams } from "../types";

/**
 * @dev Input for trade value calculation with all fees
 * @dev Mirrors contract's TradeValueInput struct
 */
export type TradeValueInput = {
  trade: Trade;
  currentPrice: number;
  collateralPriceUsd: number;
  fees: {
    openingFeeCollateral: number;
    closingFeeCollateral: number;
    holdingFeesCollateral: number;
  };
};

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
  // Core PnL values
  pnlPercent: number;
  pnlCollateral: number;
  tradeValue: number;

  // Unrealized PnL (after holding fees, before closing fee)
  uPnlCollateral: number;
  uPnlPercent: number;

  // Realized PnL (after all fees)
  realizedPnlCollateral: number;
  realizedPnlPercent: number;

  // Fee breakdown
  fees: FeeBreakdown;

  // Price impact (v10+)
  priceImpact?: PriceImpactBreakdown;

  // Status flags
  isLiquidated: boolean;
  isProfitable: boolean;

  // Additional info
  leveragedPositionSize: number;
  netPnlAfterFees: number;
};

/**
 * @dev Simple PnL result for backward compatibility
 */
export type SimplePnlResult = [pnlCollateral: number, pnlPercent: number];

/**
 * @dev Input for PnL calculation with price impact
 */
export type PnlWithPriceImpactInput = {
  trade: Trade;
  tradeInfo: TradeInfo;
  oraclePrice: number;
  currentPairPrice: number;
  usePriceImpact: boolean;
  includeOpeningFees?: boolean;
};

/**
 * @dev Context for v10 PnL calculations
 */
export type V10PnlContext = {
  tradeFeesData: TradeFeesData;
  priceImpactContext?: any;
  skewContext?: any;
  cumulVolContext?: any;
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
    initialAccFeesV1?: BorrowingFee.InitialAccFees;
  };
};
