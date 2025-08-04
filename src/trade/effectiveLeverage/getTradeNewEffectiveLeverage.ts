/**
 * @dev Trade effective leverage calculations
 * @dev Mirrors contract's TradingCommonUtils.getTradeNewEffectiveLeverage
 */
import {
  TradeEffectiveLeverageInput,
  TradeEffectiveLeverageContext,
  TradeEffectiveLeverageResult,
} from "./types";
import { getTradeClosingPriceImpact } from "..";

export type {
  TradeEffectiveLeverageInput,
  TradeEffectiveLeverageContext,
  TradeEffectiveLeverageResult,
};

export { buildTradeEffectiveLeverageContext } from "./builder";

/**
 * @dev Calculates the effective leverage of a trade accounting for unrealized PnL
 * @dev Effective leverage increases when PnL is negative and decreases when positive
 * @dev Mirrors contract's getTradeNewEffectiveLeverage function
 * @param input Trade parameters including new position values
 * @param context Combined context for calculations
 * @returns Effective leverage and related values
 */
export const getTradeNewEffectiveLeverage = (
  input: TradeEffectiveLeverageInput,
  context: TradeEffectiveLeverageContext
): TradeEffectiveLeverageResult => {
  const {
    trade,
    newOpenPrice,
    newCollateralAmount,
    newLeverage,
    currentPairPrice,
    openingFeesCollateral,
  } = input;

  const { closingPriceImpactContext } = context;

  // Calculate new position size
  const newPositionSize = newCollateralAmount * newLeverage;

  // Calculate price impact for closing at current price
  const closingPriceImpact = getTradeClosingPriceImpact(
    {
      trade: {
        ...trade,
        openPrice: newOpenPrice,
        collateralAmount: newCollateralAmount,
        leverage: newLeverage,
      },
      oraclePrice: currentPairPrice,
      positionSizeCollateral: newPositionSize,
      currentPairPrice: currentPairPrice,
      useCumulativeVolPriceImpact: true,
      collateralIndex: trade.collateralIndex,
      pairIndex: trade.pairIndex,
      pairSpreadP: context.baseSpreadP,
      contractsVersion: closingPriceImpactContext.tradeInfo.contractsVersion,
    },
    closingPriceImpactContext
  );

  // Calculate unrealized PnL
  // For longs: (exitPrice - entryPrice) * positionSizeToken
  // For shorts: (entryPrice - exitPrice) * positionSizeToken
  const priceDiff = trade.long
    ? closingPriceImpact.priceAfterImpact - newOpenPrice
    : newOpenPrice - closingPriceImpact.priceAfterImpact;

  const unrealizedPnl = priceDiff * closingPriceImpact.positionSizeToken;

  // Calculate effective collateral (collateral + PnL - fees)
  // Note: fees are subtracted because they reduce the effective collateral
  const effectiveCollateral =
    newCollateralAmount + unrealizedPnl - openingFeesCollateral;

  // Calculate effective leverage
  // If effective collateral is <= 0, leverage is effectively infinite
  const effectiveLeverage =
    effectiveCollateral > 0
      ? newPositionSize / effectiveCollateral
      : Number.MAX_SAFE_INTEGER;

  return {
    effectiveLeverage,
    unrealizedPnl,
    effectiveCollateral,
    positionSize: newPositionSize,
  };
};

/**
 * @dev Simplified version for existing positions (no opening fees)
 * @param input Trade parameters
 * @param context Combined context
 * @returns Effective leverage and related values
 */
export const getTradeEffectiveLeverage = (
  input: Omit<TradeEffectiveLeverageInput, "openingFeesCollateral">,
  context: TradeEffectiveLeverageContext
): TradeEffectiveLeverageResult => {
  return getTradeNewEffectiveLeverage(
    {
      ...input,
      openingFeesCollateral: 0,
    },
    context
  );
};
