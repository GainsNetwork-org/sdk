import {
  GetMarketLeverageRestrictionsContext,
  MarketLeverageRestrictions,
} from "./types";

/**
 * Gets the leverage restrictions for a trading pair, including both regular and counter trade limits
 * @param context Context containing group limits, pair overrides, and counter trade settings
 * @returns Object with regular and counter trade leverage restrictions
 */
export const getMarketLeverageRestrictions = (
  context: GetMarketLeverageRestrictionsContext
): MarketLeverageRestrictions => {
  const {
    groupMinLeverage,
    groupMaxLeverage,
    pairMaxLeverage,
    counterTradeSettings,
  } = context;

  // Calculate regular trade leverage limits
  let regularMin = groupMinLeverage;
  let regularMax =
    pairMaxLeverage === undefined || pairMaxLeverage === 0
      ? groupMaxLeverage
      : pairMaxLeverage;

  // If max is less than min, set both to 0 (pair is effectively disabled)
  if (regularMax < regularMin) {
    regularMin = 0;
    regularMax = 0;
  }

  // Calculate counter trade leverage limits if settings exist
  let counterTradeLimits = null;
  if (counterTradeSettings) {
    // Counter trades use the group's min leverage but have their own max leverage
    counterTradeLimits = {
      min: groupMinLeverage,
      max: counterTradeSettings.maxLeverage,
    };
  }

  return {
    regular: {
      min: regularMin,
      max: regularMax,
    },
    counterTrade: counterTradeLimits,
  };
};
