import {
  Fee,
  OpenInterest,
  PairFundingFees,
  PairParams,
  PairRolloverFees,
} from "../types";

export const getClosingFee = (
  posDai: number,
  leverage: number,
  pairIndex: number,
  pairFee: Fee | undefined
): number => {
  if (
    posDai === undefined ||
    leverage === undefined ||
    pairIndex === undefined ||
    pairFee === undefined
  ) {
    return 0;
  }

  const { closeFeeP, nftLimitOrderFeeP } = pairFee;

  return (closeFeeP + nftLimitOrderFeeP) * posDai * leverage;
};

export type GetFundingFeeContext = {
  currentBlock?: number;
  pairParams?: PairParams;
  pairFundingFees?: PairFundingFees;
  openInterest?: OpenInterest;
};

export const getFundingFee = (
  leveragedPosDai: number,
  initialAccFundingFees: number,
  buy: boolean,
  openedAfterUpdate: boolean,
  context: GetFundingFeeContext
): number => {
  const { pairParams, pairFundingFees, openInterest, currentBlock } = context;

  if (
    !currentBlock ||
    !openedAfterUpdate ||
    pairParams === undefined ||
    pairFundingFees === undefined ||
    openInterest === undefined
  )
    return 0;

  const { accPerOiLong, accPerOiShort, lastUpdateBlock } = pairFundingFees;
  const { fundingFeePerBlockP } = pairParams;

  const { long: longOi, short: shortOi } = openInterest;

  const fundingFeesPaidByLongs =
    (longOi - shortOi) * fundingFeePerBlockP * (currentBlock - lastUpdateBlock);

  const pendingAccFundingFees = buy
    ? accPerOiLong + fundingFeesPaidByLongs / longOi
    : accPerOiShort + (fundingFeesPaidByLongs * -1) / shortOi;

  return leveragedPosDai * (pendingAccFundingFees - initialAccFundingFees);
};

export type GetRolloverFeeContext = {
  currentBlock?: number;
  pairParams?: PairParams;
  pairRolloverFees?: PairRolloverFees;
};

export const getRolloverFee = (
  posDai: number,
  initialAccRolloverFees: number,
  openedAfterUpdate: boolean,
  context: GetRolloverFeeContext
): number => {
  const { pairParams, pairRolloverFees, currentBlock } = context;

  if (
    !currentBlock ||
    !openedAfterUpdate ||
    pairParams === undefined ||
    pairRolloverFees === undefined
  )
    return 0;

  const { accPerCollateral, lastUpdateBlock } = pairRolloverFees;
  const { rolloverFeePerBlockP } = pairParams;

  const pendingAccRolloverFees =
    accPerCollateral + (currentBlock - lastUpdateBlock) * rolloverFeePerBlockP;

  return posDai * (pendingAccRolloverFees - initialAccRolloverFees);
};

export * from "./borrowing";
