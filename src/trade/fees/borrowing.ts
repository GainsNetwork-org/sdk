import { OpenInterest } from "../types";

export type PairGroup = {
  groupIndex: number;
  initialAccFeeLong: number;
  initialAccFeeShort: number;
  prevGroupAccFeeLong: number;
  prevGroupAccFeeShort: number;
  pairAccFeeLong: number;
  pairAccFeeShort: number;
  block: number;
};

export type Pair = {
  groups: PairGroup[];
  feePerBlock: number;
  accFeeLong: number;
  accFeeShort: number;
  accLastUpdatedBlock: number;
};

export type Group = {
  oiLong: number;
  oiShort: number;
  feePerBlock: number;
  accFeeLong: number;
  accFeeShort: number;
  accLastUpdatedBlock: number;
};

export type InitialAccBorrowingFees = {
  accPairFee: number;
  accGroupFee: number;
  block: number;
};

export type GetBorrowingFeeContext = {
  pairGroups: PairGroup[];
} & GetPairGroupAccFeesDeltasContext;

export const getBorrowingFee = (
  posDai: number,
  pairIndex: number,
  long: boolean,
  initialAccFees: InitialAccBorrowingFees,
  context: GetBorrowingFeeContext
): number => {
  const { pairGroups } = context;

  let fee = 0;
  for (let i = pairGroups.length; i > 0; i--) {
    const { deltaGroup, deltaPair, beforeTradeOpen } =
      getPairGroupAccFeesDeltas(
        i - 1,
        pairGroups,
        initialAccFees,
        pairIndex,
        long,
        context
      );

    fee += (posDai * Math.max(deltaGroup, deltaPair)) / 100;

    if (beforeTradeOpen) {
      break;
    }
  }

  return fee;
};

const getPairPendingAccFees = (
  pairIndex: number,
  currentBlock: number,
  vaultTvl: number,
  context: { pairs: Pair[]; openInterest: OpenInterest }
): { accFeeLong: number; accFeeShort: number; delta: number } => {
  const {
    pairs,
    openInterest: { long, short },
  } = context;

  const pair = pairs[pairIndex];

  return getPendingAccFees(
    pair.accFeeLong,
    pair.accFeeShort,
    long,
    short,
    pair.feePerBlock,
    currentBlock,
    pair.accLastUpdatedBlock,
    vaultTvl
  );
};

const getPairPendingAccFee = (
  pairIndex: number,
  currentBlock: number,
  vaultTvl: number,
  long: boolean,
  context: { pairs: Pair[]; openInterest: OpenInterest }
): number => {
  const { accFeeLong, accFeeShort } = getPairPendingAccFees(
    pairIndex,
    currentBlock,
    vaultTvl,
    context
  );
  return long ? accFeeLong : accFeeShort;
};

const getGroupPendingAccFees = (
  groupIndex: number,
  currentBlock: number,
  vaultTvl: number,
  context: { groups: Group[] }
): { accFeeLong: number; accFeeShort: number; delta: number } => {
  const { groups } = context;
  const group = groups[groupIndex];
  return getPendingAccFees(
    group.accFeeLong,
    group.accFeeShort,
    group.oiLong,
    group.oiShort,
    group.feePerBlock,
    currentBlock,
    group.accLastUpdatedBlock,
    vaultTvl
  );
};

const getGroupPendingAccFee = (
  groupIndex: number,
  currentBlock: number,
  vaultTvl: number,
  long: boolean,
  context: { groups: Group[] }
): number => {
  const { accFeeLong, accFeeShort } = getGroupPendingAccFees(
    groupIndex,
    currentBlock,
    vaultTvl,
    context
  );
  return long ? accFeeLong : accFeeShort;
};

type GetPairGroupAccFeesDeltasContext = {
  currentBlock: number;
  vaultTvl: number;
  groups: Group[];
  pairs: Pair[];
  pairOpenInterest: OpenInterest;
};
const getPairGroupAccFeesDeltas = (
  i: number,
  pairGroups: PairGroup[],
  initialFees: InitialAccBorrowingFees,
  pairIndex: number,
  long: boolean,
  context: GetPairGroupAccFeesDeltasContext
): { deltaGroup: number; deltaPair: number; beforeTradeOpen: boolean } => {
  const group = pairGroups[i];
  const beforeTradeOpen = group.block <= initialFees.block;

  let deltaGroup, deltaPair;
  if (i == pairGroups.length - 1) {
    const { currentBlock, vaultTvl, groups, pairs, pairOpenInterest } = context;
    deltaGroup = getGroupPendingAccFee(
      group.groupIndex,
      currentBlock,
      vaultTvl,
      long,
      { groups }
    );
    deltaPair = getPairPendingAccFee(pairIndex, currentBlock, vaultTvl, long, {
      pairs,
      openInterest: pairOpenInterest,
    });
  } else {
    const nextGroup = pairGroups[i + 1];
    if (beforeTradeOpen && nextGroup.block <= initialFees.block) {
      return { deltaGroup: 0, deltaPair: 0, beforeTradeOpen };
    }
    deltaGroup = long
      ? nextGroup.prevGroupAccFeeLong
      : nextGroup.prevGroupAccFeeShort;
    deltaPair = long ? nextGroup.pairAccFeeLong : nextGroup.pairAccFeeShort;
  }

  if (beforeTradeOpen) {
    deltaGroup -= initialFees.accGroupFee;
    deltaPair -= initialFees.accPairFee;
  } else {
    deltaGroup -= long ? group.initialAccFeeLong : group.initialAccFeeShort;
    deltaPair -= long ? group.pairAccFeeLong : group.pairAccFeeShort;
  }

  return { deltaGroup, deltaPair, beforeTradeOpen };
};

const getPendingAccFees = (
  accFeeLong: number,
  accFeeShort: number,
  oiLong: number,
  oiShort: number,
  feePerBlock: number,
  currentBlock: number,
  accLastUpdatedBlock: number,
  vaultTvl: number
): { accFeeLong: number; accFeeShort: number; delta: number } => {
  const delta =
    ((oiLong - oiShort) * feePerBlock * (currentBlock - accLastUpdatedBlock)) /
    vaultTvl;

  const newAccFeeLong = delta > 0 ? accFeeLong + delta : accFeeLong;
  const newAccFeeShort = delta < 0 ? accFeeShort - delta : accFeeShort;

  return { accFeeLong: newAccFeeLong, accFeeShort: newAccFeeShort, delta };
};

export const borrowingFeeUtils = {
  getPairGroupAccFeesDeltas,
  getPairPendingAccFees,
  getPairPendingAccFee,
  getGroupPendingAccFees,
  getGroupPendingAccFee,
  getPendingAccFees,
};
