/**
 * @dev Types for PnL calculations
 */

import { Trade, TradeInfo, TradeFeesData } from "../types";

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
