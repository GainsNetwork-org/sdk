import { getBaseSpreadP, getSpreadWithPriceImpactP } from "./spread";
import { PairParams, OpenInterest } from "./types";

describe("getBaseSpreadP", () => {
  it("should return 0 if pair is undefined", () => {
    const result = getBaseSpreadP(undefined, 10);
    expect(result).toBe(0);
  });

  it("should return the base spread percentage if spreadReductionP is undefined", () => {
    const spreadP = 20;
    const result = getBaseSpreadP(spreadP, undefined);
    expect(result).toBe(spreadP);
  });

  it("should return the base spread percentage if spreadReductionP is 0", () => {
    const spreadP = 20;
    const result = getBaseSpreadP(spreadP, 0);
    expect(result).toBe(spreadP);
  });

  it("should apply the spread reduction percentage and return the updated spread percentage", () => {
    const spreadP = 20;
    const spreadReductionP = 10;
    const expected = (spreadP * (100 - spreadReductionP)) / 100;
    const result = getBaseSpreadP(spreadP, spreadReductionP);
    expect(result).toBe(expected);
  });

  it("should return 0 if the spread reduction percentage is 100", () => {
    const spreadP = 20;
    const result = getBaseSpreadP(spreadP, 100);
    expect(result).toBe(0);
  });
});

describe("getSpreadWithPriceImpactP", () => {
  const baseSpreadP = 20;
  const collateral = 10;
  const leverage = 2;
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

  it("should return 0 if baseSpreadP is undefined", () => {
    const result = getSpreadWithPriceImpactP(
      // @ts-ignore
      undefined,
      true,
      collateral,
      leverage,
      pairParams,
      openInterest
    );
    expect(result).toBe(0);
  });

  it("should return baseSpreadP if any required parameter is missing", () => {
    const result = getSpreadWithPriceImpactP(
      baseSpreadP,
      true,
      collateral,
      leverage,
      undefined,
      openInterest
    );
    expect(result).toBe(baseSpreadP);
  });

  it("should calculate the spread for a long order", () => {
    const onePercentDepth = pairParams.onePercentDepthAbove;
    const existingOi = openInterest.long;
    const expected =
      baseSpreadP +
      (existingOi + (collateral * leverage) / 2) / onePercentDepth / 100;

    const result = getSpreadWithPriceImpactP(
      baseSpreadP,
      true,
      collateral,
      leverage,
      pairParams,
      openInterest
    );
    expect(result).toBe(expected);
  });

  it("should calculate the spread for a short order", () => {
    const onePercentDepth = pairParams.onePercentDepthBelow;
    const existingOi = openInterest.short;
    const expected =
      baseSpreadP +
      (existingOi + (collateral * leverage) / 2) / onePercentDepth / 100;

    const result = getSpreadWithPriceImpactP(
      baseSpreadP,
      false,
      collateral,
      leverage,
      pairParams,
      openInterest
    );
    expect(result).toBe(expected);
  });
});
