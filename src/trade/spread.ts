import {
  LiquidationParams,
  OiWindows,
  OiWindowsSettings,
  PairDepth,
  PairFactor,
} from "./types";
import { getActiveOi, getCurrentOiWindowId } from "./oiWindows";
import {
  DEFAULT_CUMULATIVE_FACTOR,
  DEFAULT_PROTECTION_CLOSE_FACTOR,
} from "../constants";
import { ContractsVersion } from "../contracts/types";

export type SpreadContext = {
  isOpen?: boolean;
  isPnlPositive?: boolean;
  createdBlock?: number;
  liquidationParams?: LiquidationParams | undefined;
  currentBlock?: number | undefined;
  contractsVersion?: ContractsVersion | undefined;
  protectionCloseFactorWhitelist?: boolean;
} & Partial<PairFactor>;

export const getProtectionCloseFactor = (
  spreadCtx: SpreadContext | undefined
): number => {
  if (
    spreadCtx === undefined ||
    spreadCtx.contractsVersion === ContractsVersion.BEFORE_V9_2 ||
    spreadCtx.isOpen === undefined ||
    spreadCtx.isPnlPositive === undefined ||
    isProtectionCloseFactorActive(spreadCtx) !== true
  )
    return DEFAULT_PROTECTION_CLOSE_FACTOR;

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return spreadCtx.protectionCloseFactor!;
};

export const isProtectionCloseFactorActive = (
  spreadCtx: SpreadContext | undefined
): boolean | undefined => {
  if (
    spreadCtx === undefined ||
    spreadCtx.currentBlock === undefined ||
    spreadCtx.createdBlock === undefined ||
    spreadCtx.protectionCloseFactorBlocks === undefined ||
    spreadCtx.protectionCloseFactor === undefined
  ) {
    return undefined;
  }

  return (
    spreadCtx.isPnlPositive === true &&
    spreadCtx.isOpen === false &&
    spreadCtx.protectionCloseFactor > 0 &&
    spreadCtx.currentBlock <=
      spreadCtx.createdBlock + spreadCtx.protectionCloseFactorBlocks &&
    spreadCtx.protectionCloseFactorWhitelist !== true
  );
};

export const getCumulativeFactor = (
  spreadCtx: SpreadContext | undefined
): number => {
  if (
    spreadCtx === undefined ||
    spreadCtx.cumulativeFactor === undefined ||
    spreadCtx.cumulativeFactor === 0
  ) {
    return DEFAULT_CUMULATIVE_FACTOR;
  }

  return spreadCtx.cumulativeFactor;
};

export const getLegacyFactor = (
  spreadCtx: SpreadContext | undefined
): number => {
  return spreadCtx?.contractsVersion === ContractsVersion.BEFORE_V9_2 ? 1 : 2;
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

  if (
    // No spread or price impact when closing pre-v9.2 trades
    (spreadCtx?.isOpen === false &&
      spreadCtx?.contractsVersion === ContractsVersion.BEFORE_V9_2) ||
    // No spread or price impact for opens when `pair.exemptOnOpen` is true
    (spreadCtx?.isOpen === true && spreadCtx?.exemptOnOpen === true) ||
    // No spread or price impact for closes after `protectionCloseFactor` has expired
    // when `pair.exemptAfterProtectionCloseFactor` is true
    (spreadCtx?.isOpen === false &&
      spreadCtx?.exemptAfterProtectionCloseFactor === true &&
      isProtectionCloseFactorActive(spreadCtx) !== true)
  ) {
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

  if (oiWindowsSettings !== undefined) {
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
    getSpreadP(pairSpreadP) +
    ((activeOi * getCumulativeFactor(spreadCtx) + (collateral * leverage) / 2) /
      onePercentDepth /
      100 /
      getLegacyFactor(spreadCtx)) *
      getProtectionCloseFactor(spreadCtx)
  );
};

export const getSpreadP = (
  pairSpreadP: number | undefined,
  isLiquidation?: boolean | undefined,
  liquidationParams?: LiquidationParams | undefined
): number => {
  if (pairSpreadP === undefined || pairSpreadP === 0) {
    return 0;
  }

  const spreadP = pairSpreadP / 2;

  return isLiquidation === true &&
    liquidationParams !== undefined &&
    liquidationParams.maxLiqSpreadP > 0 &&
    spreadP > liquidationParams.maxLiqSpreadP
    ? liquidationParams.maxLiqSpreadP
    : spreadP;
};
