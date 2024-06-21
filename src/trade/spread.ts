import { OiWindows, OiWindowsSettings, PairDepth } from "./types";
import { getActiveOi, getCurrentOiWindowId } from "./oiWindows";
import { PROTECTION_CLOSE_FACTOR_BLOCKS } from "../constants";

export const getSpreadWithPriceImpactP = (
  pairSpreadP: number,
  buy: boolean,
  collateral: number,
  leverage: number,
  pairDepth: PairDepth | undefined,
  oiWindowsSettings?: OiWindowsSettings | undefined,
  oiWindows?: OiWindows | undefined,
  isOpen?: boolean,
  protectionCloseFactor?: number,
  createdBlock?: number,
  currentBlock?: number
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
      isOpen === undefined || isOpen ? buy : !buy
    );
  }

  if (!onePercentDepth || activeOi === undefined || collateral === undefined) {
    return pairSpreadP / 2;
  }

  return (
    pairSpreadP / 2 +
    ((activeOi + (collateral * leverage) / 2) / onePercentDepth / 100 / 2) *
      (protectionCloseFactor === undefined ||
      createdBlock === undefined ||
      currentBlock === undefined ||
      createdBlock + PROTECTION_CLOSE_FACTOR_BLOCKS < currentBlock
        ? 1
        : protectionCloseFactor)
  );
};
