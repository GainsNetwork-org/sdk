import { getBaseSpreadP, getSpreadWithPriceImpactP } from "./spread";
import {
  LimitOrder,
  OpenInterest,
  Pair,
  PairParams,
  OpenLimitOrderType,
} from "./types";

export const getFulfillmentPrice = (
  order: LimitOrder,
  pair: Pair,
  pairParams: PairParams,
  openInterest: OpenInterest
): number => {
  if (!order || !pair) {
    return 0;
  }

  // Get spread percentage
  const baseSpreadP = getBaseSpreadP(pair.spreadP, order.spreadReductionP);
  const spreadWithPriceImpactP = getSpreadWithPriceImpactP(
    baseSpreadP,
    order.buy,
    order.positionSize,
    order.leverage,
    pairParams,
    openInterest
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
    ? askingPrice * (1 - spreadWithPriceImpactP)
    : askingPrice * (1 + spreadWithPriceImpactP);
};
