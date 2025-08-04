/**
 * @dev Types for trade effective leverage calculations
 */
import { Trade, TradeClosingPriceImpactContext } from "..";

/**
 * @dev Input parameters for effective leverage calculation
 * @dev Mirrors contract's parameters for getTradeNewEffectiveLeverage
 */
export type TradeEffectiveLeverageInput = {
  trade: Trade;
  newOpenPrice: number;
  newCollateralAmount: number;
  newLeverage: number;
  currentPairPrice: number;
  openingFeesCollateral: number;
};

/**
 * @dev Context for effective leverage calculation
 * Includes closing price impact context for PnL calculations
 */
export type TradeEffectiveLeverageContext = {
  closingPriceImpactContext: TradeClosingPriceImpactContext;
  baseSpreadP: number;
};

/**
 * @dev Result of effective leverage calculation
 */
export type TradeEffectiveLeverageResult = {
  effectiveLeverage: number;
  unrealizedPnl: number;
  effectiveCollateral: number;
  positionSize: number;
};
