import { OiWindows, OiWindowsSettings, PairDepth } from "./types";
import { getActiveOi, getCurrentOiWindowId } from "./oiWindows";

export const getSpreadWithPriceImpactP = (
  pairSpreadP: number,
  buy: boolean,
  collateral: number,
  leverage: number,
  pairDepth: PairDepth | undefined,
  oiWindowsSettings?: OiWindowsSettings | undefined,
  oiWindows?: OiWindows | undefined
): number => {
  if (pairSpreadP === undefined) {
    return 0;
  }

  const onePercentDepth = buy
    ? pairDepth?.onePercentDepthAboveUsd
    : pairDepth?.onePercentDepthBelowUsd;

  let activeOi = undefined;

  if (oiWindowsSettings !== undefined && oiWindowsSettings?.windowsCount > 0) {
    activeOi = getActiveOi(
      getCurrentOiWindowId(oiWindowsSettings),
      oiWindowsSettings.windowsCount,
      oiWindows,
      buy
    );
  }

  if (!onePercentDepth || activeOi === undefined || collateral === undefined) {
    return pairSpreadP;
  }

  return (
    pairSpreadP +
    (activeOi + (collateral * leverage) / 2) / onePercentDepth / 100
  );
};
