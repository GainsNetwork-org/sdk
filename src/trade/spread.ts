import { OpenInterest, PairParams } from "./types";

export const getBaseSpreadP = (
  pairSpreadP: number | undefined,
  spreadReductionP: number | undefined
): number => {
  if (!pairSpreadP) {
    return 0;
  }

  if (!spreadReductionP) {
    return pairSpreadP;
  }

  return (pairSpreadP * (100 - spreadReductionP)) / 100;
};

export const getSpreadWithPriceImpactP = (
  baseSpreadP: number,
  buy: boolean,
  collateral: number,
  leverage: number,
  pairParams: PairParams | undefined,
  openInterest: OpenInterest | undefined
): number => {
  if (baseSpreadP === undefined) {
    return 0;
  }

  const onePercentDepth = buy
    ? pairParams?.onePercentDepthAbove
    : pairParams?.onePercentDepthBelow;
  const existingOi = buy ? openInterest?.long : openInterest?.short;

  if (
    !onePercentDepth ||
    existingOi === undefined ||
    collateral === undefined
  ) {
    return baseSpreadP;
  }

  return (
    baseSpreadP +
    (existingOi + (collateral * leverage) / 2) / onePercentDepth / 100
  );
};
