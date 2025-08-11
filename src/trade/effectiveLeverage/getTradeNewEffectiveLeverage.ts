/**
 * @dev Trade effective leverage calculations
 * @dev Mirrors contract's TradingCommonUtils.getTradeNewEffectiveLeverage
 */
import {
  TradeEffectiveLeverageInput,
  TradeEffectiveLeverageResult,
} from "./types";

export type { TradeEffectiveLeverageInput, TradeEffectiveLeverageResult };

/**
 * @dev Calculates the effective leverage of a trade accounting for unrealized PnL
 * @dev Effective leverage increases when PnL is negative and decreases when positive
 * @dev Mirrors contract's getTradeNewEffectiveLeverage function
 * @param input Trade parameters including new position values
 * @returns Effective leverage and related values
 */
export const getTradeNewEffectiveLeverage = (
  input: TradeEffectiveLeverageInput
): TradeEffectiveLeverageResult => {
  const {
    newOpenPrice,
    newCollateralAmount,
    newLeverage,
    currentPairPrice,
    tradeValueCollateral,
  } = input;

  // Calculate new position size
  const newPositionSize = newCollateralAmount * newLeverage;

  // Calculate dynamic position size (matching on-chain logic)
  // This adjusts position size based on current price vs open price
  const newPosSizeCollateralDynamic =
    (newPositionSize * currentPairPrice) / newOpenPrice;

  // Use the provided trade value as margin value
  // This already includes collateral + PnL with price impact - fees
  const newMarginValueCollateral = tradeValueCollateral;

  // Calculate effective leverage (matching on-chain)
  // If margin value is <= 0, leverage is effectively infinite
  const effectiveLeverage =
    newMarginValueCollateral > 0
      ? newPosSizeCollateralDynamic / newMarginValueCollateral
      : Number.MAX_SAFE_INTEGER;

  return {
    effectiveLeverage,
    unrealizedPnl: tradeValueCollateral - newCollateralAmount,
    effectiveCollateral: newMarginValueCollateral,
    positionSize: newPositionSize,
  };
};

/**
 * @dev Simplified version for existing positions
 * @param input Trade parameters
 * @returns Effective leverage and related values
 */
export const getTradeEffectiveLeverage = (
  input: TradeEffectiveLeverageInput
): TradeEffectiveLeverageResult => {
  return getTradeNewEffectiveLeverage(input);
};
