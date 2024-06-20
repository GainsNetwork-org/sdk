import { getSpreadWithPriceImpactP } from "./spread";
import { PairDepth } from "./types";

describe("getSpreadWithPriceImpactP", () => {
  const baseSpreadP = 20;
  const collateral = 10;
  const leverage = 2;
  const pairParams: PairDepth = {
    onePercentDepthAboveUsd: 1000,
    onePercentDepthBelowUsd: 1000,
  };

  it("should return 0 if baseSpreadP is undefined", () => {
    const result = getSpreadWithPriceImpactP(
      // @ts-ignore
      undefined,
      true,
      collateral,
      leverage,
      pairParams,
      undefined
    );
    expect(result).toBe(0);
  });

  it("should return baseSpreadP if any required parameter is missing", () => {
    const result = getSpreadWithPriceImpactP(
      baseSpreadP,
      true,
      collateral,
      leverage,
      undefined
    );
    expect(result).toBe(baseSpreadP / 2);
  });

  /*
  // @todo fix these tests (replace them with oiWindows)
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
  */
});
