import {
  OiWindows,
  OiWindowsSettings,
  OpenInterest,
  PairParams,
} from "./types";
import { getActiveOi, getCurrentOiWindowId } from "./oiWindows";

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
  openInterest: OpenInterest | undefined,
  oiWindowsSettings?: OiWindowsSettings | undefined,
  oiWindows?: OiWindows | undefined
): number => {
  if (baseSpreadP === undefined) {
    return 0;
  }

  const onePercentDepth = buy
    ? pairParams?.onePercentDepthAbove
    : pairParams?.onePercentDepthBelow;

  let activeOi = buy ? openInterest?.long : openInterest?.short;

  if (oiWindowsSettings !== undefined && oiWindowsSettings?.windowsCount > 0) {
    const currWindowId = getCurrentOiWindowId(oiWindowsSettings);

    activeOi = getActiveOi(
      currWindowId,
      oiWindowsSettings.windowsCount,
      oiWindows,
      buy
    );
  }

  if (!onePercentDepth || activeOi === undefined || collateral === undefined) {
    return baseSpreadP;
  }

  return (
    baseSpreadP +
    (activeOi + (collateral * leverage) / 2) / onePercentDepth / 100
  );
};
