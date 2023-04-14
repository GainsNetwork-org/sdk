import { getFulfillmentPrice } from "./openLimitOrder";
import { getBaseSpreadP, getSpreadWithPriceImpactP } from "./spread";
import {
  LimitOrder,
  OpenInterest,
  Pair,
  PairParams,
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
  };
  const pair: Pair = {
    feeIndex: 0,
    from: "FROM",
    to: "TO",
    name: "FROM/TO",
    groupIndex: 0,
    pairIndex: 100,
    spreadP: 20,
  };
  const pairParams: PairParams = {
    onePercentDepthAbove: 1000,
    onePercentDepthBelow: 1000,
    rolloverFeePerBlockP: 0.01,
    fundingFeePerBlockP: 0.01,
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
    const baseSpreadP = getBaseSpreadP(pair.spreadP, order.spreadReductionP);
    const spreadWithPriceImpactP = getSpreadWithPriceImpactP(
      baseSpreadP,
      order.buy,
      order.positionSize,
      order.leverage,
      pairParams,
      openInterest
    );
    const askingPrice = order.maxPrice;
    const expected = askingPrice * (1 - spreadWithPriceImpactP);

    const result = getFulfillmentPrice(order, pair, pairParams, openInterest);
    expect(result).toBe(expected);
  });

  it("should calculate the trigger price for a sell order", () => {
    const sellOrder = { ...order, buy: false };
    const baseSpreadP = getBaseSpreadP(
      pair.spreadP,
      sellOrder.spreadReductionP
    );
    const spreadWithPriceImpactP = getSpreadWithPriceImpactP(
      baseSpreadP,
      sellOrder.buy,
      sellOrder.positionSize,
      sellOrder.leverage,
      pairParams,
      openInterest
    );
    const askingPrice = sellOrder.minPrice;
    const expected = askingPrice * (1 + spreadWithPriceImpactP);

    const result = getFulfillmentPrice(
      sellOrder,
      pair,
      pairParams,
      openInterest
    );
    expect(result).toBe(expected);
  });
});
