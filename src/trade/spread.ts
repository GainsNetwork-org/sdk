import { OiWindows, OiWindowsSettings, PairDepth } from "./types";
import { getActiveOi, getCurrentOiWindowId } from "./oiWindows";
import { PROTECTION_CLOSE_FACTOR_BLOCKS } from "../constants";

export type SpreadContext = {
  isOpen: boolean | undefined;
  protectionCloseFactor: number | undefined;
  createdBlock: number | undefined;
  currentBlock: number | undefined;
};

export const getProtectionCloseFactor = (
  spreadCtx: SpreadContext | undefined
): number => {
  return spreadCtx === undefined ||
    spreadCtx.protectionCloseFactor === undefined ||
    spreadCtx.createdBlock === undefined ||
    spreadCtx.currentBlock === undefined ||
    spreadCtx.createdBlock + PROTECTION_CLOSE_FACTOR_BLOCKS <
      spreadCtx.currentBlock
    ? 1
    : spreadCtx.protectionCloseFactor;
};

export const getSpreadWithPriceImpactP = (
  pairSpreadP: number,
  buy: boolean,
  collateral: number,
  leverage: number,
  pairDepth: PairDepth | undefined,
  oiWindowsSettings?: OiWindowsSettings | undefined,
  oiWindows?: OiWindows | undefined,
  spreadCtx?: SpreadContext | undefined
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
      spreadCtx === undefined ||
        spreadCtx.isOpen === undefined ||
        spreadCtx.isOpen
        ? buy
        : !buy
    );
  }

  if (!onePercentDepth || activeOi === undefined || collateral === undefined) {
    return pairSpreadP / 2;
  }

  return (
    pairSpreadP / 2 +
    ((activeOi + (collateral * leverage) / 2) / onePercentDepth / 100 / 2) *
      getProtectionCloseFactor(spreadCtx)
  );
};
