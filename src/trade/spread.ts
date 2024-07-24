import { OiWindows, OiWindowsSettings, PairDepth } from "./types";
import { getActiveOi, getCurrentOiWindowId } from "./oiWindows";
import { DEFAULT_PROTECTION_CLOSE_FACTOR } from "../constants";

export type SpreadContext = {
  isOpen?: boolean;
  isPnlPositive?: boolean;
  protectionCloseFactor?: number;
  protectionCloseFactorBlocks?: number;
  createdBlock?: number;
  currentBlock: number | undefined;
};

export const getProtectionCloseFactor = (
  spreadCtx: SpreadContext | undefined
): number => {
  if (
    spreadCtx === undefined ||
    spreadCtx.isOpen === undefined ||
    spreadCtx.isPnlPositive === undefined ||
    spreadCtx.protectionCloseFactor === undefined ||
    spreadCtx.protectionCloseFactorBlocks === undefined ||
    spreadCtx.createdBlock === undefined ||
    spreadCtx.currentBlock === undefined
  )
    return DEFAULT_PROTECTION_CLOSE_FACTOR;

  if (
    spreadCtx.isPnlPositive &&
    !spreadCtx.isOpen &&
    spreadCtx.protectionCloseFactor > 0 &&
    spreadCtx.currentBlock <=
      spreadCtx.createdBlock + spreadCtx.protectionCloseFactorBlocks
  ) {
    return spreadCtx.protectionCloseFactor;
  }

  return DEFAULT_PROTECTION_CLOSE_FACTOR;
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
    ? // if `long`
      spreadCtx?.isOpen !== false // assumes it's an open unless it's explicitly false
      ? pairDepth?.onePercentDepthAboveUsd
      : pairDepth?.onePercentDepthBelowUsd
    : // if `short`
    spreadCtx?.isOpen !== false
    ? pairDepth?.onePercentDepthBelowUsd
    : pairDepth?.onePercentDepthAboveUsd;

  let activeOi = undefined;

  if (oiWindowsSettings !== undefined && oiWindowsSettings?.windowsCount > 0) {
    activeOi = getActiveOi(
      getCurrentOiWindowId(oiWindowsSettings),
      oiWindowsSettings.windowsCount,
      oiWindows,
      spreadCtx?.isOpen !== false ? buy : !buy
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
