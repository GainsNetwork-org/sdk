/**
 * @dev Types for trade closing price impact calculations
 */

import { CumulVolContext } from "../cumulVol";
import { SkewPriceImpactContext } from "../skew/types";
import { Trade, TradeInfo, PairIndex } from "../../types";

/**
 * @dev Input parameters for trade closing price impact
 * @dev Mirrors contract's TradePriceImpactInput struct
 */
export type TradeClosingPriceImpactInput = {
  // Trade information
  trade: Trade;
  oraclePrice: number;
  positionSizeCollateral: number;
  currentPairPrice: number;
  useCumulativeVolPriceImpact: boolean;

  // Additional fields needed for SDK
  collateralIndex: number;
  pairIndex: PairIndex;
  pairSpreadP: number;
  contractsVersion: number;
};

/**
 * @dev Context for trade closing price impact calculation
 * Combines contexts from spread, cumul vol, and skew
 */
export type TradeClosingPriceImpactContext = {
  collateralPriceUsd: number; // Required for USD conversion
  cumulVolContext: CumulVolContext;
  skewContext: SkewPriceImpactContext;
  tradeInfo: TradeInfo; // For createdBlock, contractsVersion
};

/**
 * @dev Result of trade closing price impact calculation
 * @dev Mirrors contract's TradePriceImpact struct with additional return value
 */
export type TradeClosingPriceImpactResult = {
  // Price impact breakdown
  positionSizeToken: number; // Position size in tokens
  fixedSpreadP: number; // Fixed spread percentage (reversed for closing)
  cumulVolPriceImpactP: number; // Cumulative volume impact component
  skewPriceImpactP: number; // Skew impact component (v10+)
  totalPriceImpactP: number; // Sum of all impacts
  priceAfterImpact: number; // Final execution price after all impacts

  // Additional return value
  tradeValueCollateralNoFactor: number; // Trade value without protection factor (for PnL determination)
};
