import { OpenInterest } from "../../types";
import * as BorrowingFee from "./types";

export type GetBorrowingFeeContext = {
  currentBlock: number;
  accBlockPerVaultMarketCap: number;
  groups: BorrowingFee.Group[];
  pairs: BorrowingFee.Pair[];
  openInterest: OpenInterest;
};

export const getBorrowingFee = (
  posDai: number,
  pairIndex: number,
  long: boolean,
  initialAccFees: BorrowingFee.InitialAccFees,
  context: GetBorrowingFeeContext
): number => {
  // TODO: What to return if missing dependencies?
  if (!context.groups || !context.pairs || !context.openInterest) {
    return 0;
  }

  const { pairs } = context;
  const pairGroups = pairs[pairIndex].groups;
  const firstPairGroup = pairGroups?.length > 0 ? pairGroups[0] : undefined;

  let fee = 0;
  if (!firstPairGroup || firstPairGroup.block > initialAccFees.block) {
    fee = !firstPairGroup
      ? getPairPendingAccFee(
          pairIndex,
          context.currentBlock,
          context.accBlockPerVaultMarketCap,
          long,
          context
        )
      : long
      ? firstPairGroup.pairAccFeeLong
      : firstPairGroup.pairAccFeeShort;
  }

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
  accBlockPerVaultMarketCap: number,
  context: { pairs: BorrowingFee.Pair[]; openInterest: OpenInterest }
): { accFeeLong: number; accFeeShort: number; delta: number } => {
  const {
    pairs,
    openInterest: { long, short },
  } = context;

  const pair = pairs[pairIndex];
  const vaultTvl = getAverageVaultTvl(
    accBlockPerVaultMarketCap,
    pair.lastAccBlockPerVaultMarketCap,
    currentBlock - pair.accLastUpdatedBlock
  );
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
  accBlockPerVaultMarketCap: number,
  long: boolean,
  context: { pairs: BorrowingFee.Pair[]; openInterest: OpenInterest }
): number => {
  const { accFeeLong, accFeeShort } = getPairPendingAccFees(
    pairIndex,
    currentBlock,
    accBlockPerVaultMarketCap,
    context
  );
  return long ? accFeeLong : accFeeShort;
};

const getGroupPendingAccFees = (
  groupIndex: number,
  currentBlock: number,
  accBlockPerVaultMarketCap: number,
  context: { groups: BorrowingFee.Group[] }
): { accFeeLong: number; accFeeShort: number; delta: number } => {
  const { groups } = context;
  const group = groups[groupIndex];
  const vaultTvl = getAverageVaultTvl(
    accBlockPerVaultMarketCap,
    group.lastAccBlockPerVaultMarketCap,
    currentBlock - group.accLastUpdatedBlock
  );
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
  accBlockPerVaultMarketCap: number,
  long: boolean,
  context: { groups: BorrowingFee.Group[] }
): number => {
  const { accFeeLong, accFeeShort } = getGroupPendingAccFees(
    groupIndex,
    currentBlock,
    accBlockPerVaultMarketCap,
    context
  );
  return long ? accFeeLong : accFeeShort;
};

const getPairGroupAccFeesDeltas = (
  i: number,
  pairGroups: BorrowingFee.PairGroup[],
  initialFees: BorrowingFee.InitialAccFees,
  pairIndex: number,
  long: boolean,
  context: GetBorrowingFeeContext
): { deltaGroup: number; deltaPair: number; beforeTradeOpen: boolean } => {
  const group = pairGroups[i];
  const beforeTradeOpen = group.block < initialFees.block;

  let deltaGroup, deltaPair;
  if (i == pairGroups.length - 1) {
    const {
      currentBlock,
      accBlockPerVaultMarketCap,
      groups,
      pairs,
      openInterest,
    } = context;
    deltaGroup = getGroupPendingAccFee(
      group.groupIndex,
      currentBlock,
      accBlockPerVaultMarketCap,
      long,
      { groups }
    );
    deltaPair = getPairPendingAccFee(
      pairIndex,
      currentBlock,
      accBlockPerVaultMarketCap,
      long,
      {
        pairs,
        openInterest: openInterest,
      }
    );
  } else {
    const nextGroup = pairGroups[i + 1];
    if (beforeTradeOpen && nextGroup.block < initialFees.block) {
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

const getAverageVaultTvl = (
  accBlockPerVaultMarketCap: number,
  lastAccBlockPerVaultMarketCap: number,
  blockDelta: number
): number => {
  return accBlockPerVaultMarketCap > lastAccBlockPerVaultMarketCap
    ? blockDelta / (accBlockPerVaultMarketCap - lastAccBlockPerVaultMarketCap)
    : 1;
};

export const borrowingFeeUtils = {
  getPairGroupAccFeesDeltas,
  getPairPendingAccFees,
  getPairPendingAccFee,
  getGroupPendingAccFees,
  getGroupPendingAccFee,
  getPendingAccFees,
};

export * as BorrowingFee from "./types";
