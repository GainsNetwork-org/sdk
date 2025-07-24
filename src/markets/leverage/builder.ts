import { GlobalTradingVariablesType } from "../../backend/tradingVariables/types";
import { GetMarketLeverageRestrictionsContext } from "./types";

/**
 * Builds the context needed for getMarketLeverageRestrictions from global trading variables
 * @param globalTradingVariables Global trading variables containing pairs, groups, etc.
 * @param pairIndex The index of the trading pair
 * @param pairMaxLeverages Map of pair-specific max leverage overrides
 * @returns Context for leverage restrictions calculation
 */
export const buildMarketLeverageRestrictionsContext = (
  globalTradingVariables: GlobalTradingVariablesType,
  pairIndex: number,
  pairMaxLeverages?: { [key: number]: number }
): GetMarketLeverageRestrictionsContext => {
  const { pairs, groups, counterTradeSettings } = globalTradingVariables;

  if (!pairs || !groups || !pairs[pairIndex]) {
    throw new Error("Invalid global trading variables or pair index");
  }

  const pair = pairs[pairIndex];
  const group = groups[pair.groupIndex];

  return {
    groupMinLeverage: group.minLeverage,
    groupMaxLeverage: group.maxLeverage,
    pairMaxLeverage: pairMaxLeverages?.[pairIndex],
    counterTradeSettings: counterTradeSettings?.[pairIndex],
  };
};
