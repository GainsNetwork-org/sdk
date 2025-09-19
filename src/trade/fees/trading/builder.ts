/**
 * @dev Trading fees context builder module
 * @dev Provides builder functions for creating trading fee contexts
 */

import { Fee, GlobalTradeFeeParams, CounterTradeSettings } from "../../types";
import { GlobalTradingVariablesType } from "src/backend/tradingVariables/types";

/**
 * @dev Sub-context for trading fees
 */
export type TradingFeesSubContext = {
  fee: Fee;
  globalTradeFeeParams: GlobalTradeFeeParams;
  counterTradeSettings?: CounterTradeSettings[];
  traderFeeMultiplier?: number;
};

/**
 * @dev Builds trading fees sub-context
 */
export const buildTradingFeesContext = (
  globalTradingVariables: GlobalTradingVariablesType,
  pairIndex: number,
  traderFeeMultiplier?: number
): TradingFeesSubContext => {
  const { fees, pairs, globalTradeFeeParams, counterTradeSettings } =
    globalTradingVariables;
  const feeIndex = pairs![pairIndex].feeIndex;

  return {
    fee: fees![feeIndex],
    globalTradeFeeParams: globalTradeFeeParams!,
    counterTradeSettings,
    traderFeeMultiplier,
  };
};
