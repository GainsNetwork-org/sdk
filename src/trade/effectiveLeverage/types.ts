/**
 * @dev Types for trade effective leverage calculations
 */
import { Trade } from "..";

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
  tradeValueCollateral: number; // Trade value including collateral + net PnL (with price impact) - fees
};

/**
 * @dev Context for effective leverage calculation
 * Simplified context since price impact is now included in tradeValueCollateral
 */
export type TradeEffectiveLeverageContext = {
  // Context can be extended if needed for future calculations
  // Currently not used since tradeValueCollateral includes all necessary data
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
