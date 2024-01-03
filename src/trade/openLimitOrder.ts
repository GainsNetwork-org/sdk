import { getSpreadWithPriceImpactP } from "./spread";
import {
  LimitOrder,
  Pair,
  PairDepth,
  OpenLimitOrderType,
  OiWindowsSettings,
  OiWindows,
} from "./types";

export const getFulfillmentPrice = (
  order: LimitOrder,
  pair: Pair,
  pairDepth: PairDepth,
  oiWindowsSettings?: OiWindowsSettings,
  oiWindows?: OiWindows
): number => {
  if (!order || !pair) {
    return 0;
  }

  // Get spread percentage
  const spreadWithPriceImpactP = getSpreadWithPriceImpactP(
    pair.spreadP,
    order.buy,
    order.positionSize,
    order.leverage,
    pairDepth,
    oiWindowsSettings,
    oiWindows
  );
  if (spreadWithPriceImpactP === 0) {
    return 0;
  }

  const askingPrice =
    (order.buy && order.type === OpenLimitOrderType.REVERSAL) ||
    (!order.buy && order.type === OpenLimitOrderType.MOMENTUM)
      ? order.maxPrice
      : order.minPrice;

  return order.buy
    ? askingPrice * (1 + spreadWithPriceImpactP)
    : askingPrice * (1 - spreadWithPriceImpactP);
};
