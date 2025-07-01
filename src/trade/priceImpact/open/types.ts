/**
 * @dev Types for trade opening price impact calculations
 */

import { CumulVolContext } from "../cumulVol";
import { SkewPriceImpactContext } from "../skew/types";
import { Fee, PairIndex } from "../../types";

/**
 * @dev Input parameters for trade opening price impact
 */
export type TradeOpeningPriceImpactInput = {
  collateralIndex: number;
  pairIndex: PairIndex;
  long: boolean;
  collateralAmount: number;
  leverage: number;
  openPrice: number;
  pairSpreadP: number;
  fee: Fee;
  contractsVersion: number;
  isCounterTrade?: boolean;
};

/**
 * @dev Context for trade opening price impact calculation
 * Combines contexts from spread, cumul vol, and skew
 */
export type TradeOpeningPriceImpactContext = {
  collateralPriceUsd: number; // Required for USD conversion
  cumulVolContext: CumulVolContext;
  skewContext: SkewPriceImpactContext;
};

/**
 * @dev Result of trade opening price impact calculation
 * Mirrors contract's PriceImpact struct
 */
export type TradeOpeningPriceImpactResult = {
  priceAfterImpact: number; // Final execution price after all impacts
  percentProfitP: number; // Percent profit/loss from price impact
  cumulVolPriceImpactP: number; // Cumulative volume impact component
  baseSkewPriceImpactP: number; // Skew impact component (v10+)
  tradeSkewPriceImpactP: number; // Skew impact component (v10+)
  totalSkewPriceImpactP: number; // Sum of all skew impacts (v10+)
  totalPriceImpactP: number; // spreadP + cumulVol + skew (signed)
  totalPriceImpactPFromMarketPrice: number; // spreadP + cumulVol + trader skew (signed)
};
