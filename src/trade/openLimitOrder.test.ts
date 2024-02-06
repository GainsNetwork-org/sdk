import { getFulfillmentPrice } from "./openLimitOrder";
import { getSpreadWithPriceImpactP } from "./spread";
import {
  LimitOrder,
  OpenInterest,
  Pair,
  PairDepth,
  OpenLimitOrderType,
} from "./types";

describe("getFulfillmentPrice", () => {
  const order: LimitOrder = {
    block: 1000000,
    buy: true,
    index: 0,
    positionSize: 10,
    leverage: 10,
    spreadReductionP: 5,
    type: OpenLimitOrderType.REVERSAL,
    maxPrice: 100,
    minPrice: 90,
    pairIndex: 100,
    sl: 0,
    tp: 0,
    trader: "",
    maxSlippageP: 1,
  };
  const pair: Pair = {
    feeIndex: 0,
    from: "FROM",
    to: "TO",
    name: "FROM/TO",
    description: "Bitcoin to US Dollar",
    groupIndex: 0,
    pairIndex: 100,
    spreadP: 20,
  };
  const pairParams: PairDepth = {
    onePercentDepthAboveUsd: 1000,
    onePercentDepthBelowUsd: 1000,
  };
  const openInterest: OpenInterest = {
    long: 500,
    max: 10000,
    short: 500,
  };

  it("should return 0 if order or pair is missing", () => {
    const result = getFulfillmentPrice(
      // @ts-ignore
      undefined,
      pair,
      pairParams,
      openInterest
    );
    expect(result).toBe(0);
  });

  it("should calculate the trigger price for a buy order", () => {
    const spreadWithPriceImpactP = getSpreadWithPriceImpactP(
      pair.spreadP,
      order.buy,
      order.positionSize,
      order.leverage,
      pairParams
    );
    const askingPrice = order.maxPrice;
    const expected = askingPrice * (1 + spreadWithPriceImpactP);

    const result = getFulfillmentPrice(order, pair, pairParams);
    expect(result).toBe(expected);
  });

  it("should calculate the trigger price for a sell order", () => {
    const sellOrder = { ...order, buy: false };
    const spreadWithPriceImpactP = getSpreadWithPriceImpactP(
      pair.spreadP,
      sellOrder.buy,
      sellOrder.positionSize,
      sellOrder.leverage,
      pairParams
    );
    const askingPrice = sellOrder.minPrice;
    const expected = askingPrice * (1 - spreadWithPriceImpactP);

    const result = getFulfillmentPrice(sellOrder, pair, pairParams);
    expect(result).toBe(expected);
  });
});
