import { GNSBorrowingFeesInterfaceV6_3_2 } from "@/contracts/types/generated/GNSBorrowingFeesV6_3_2";
import { BorrowingFee } from ".";

export const convertPairGroupBorrowingFee = (
  pairGroup: GNSBorrowingFeesInterfaceV6_3_2.PairGroupStructOutput
): BorrowingFee.PairGroup => ({
  groupIndex: pairGroup.groupIndex,
  initialAccFeeLong: pairGroup.initialAccFeeLong.toNumber() / 1e10,
  initialAccFeeShort: pairGroup.initialAccFeeShort.toNumber() / 1e10,
  prevGroupAccFeeLong: pairGroup.prevGroupAccFeeLong.toNumber() / 1e10,
  prevGroupAccFeeShort: pairGroup.prevGroupAccFeeShort.toNumber() / 1e10,
  pairAccFeeLong: pairGroup.pairAccFeeLong.toNumber() / 1e10,
  pairAccFeeShort: pairGroup.pairAccFeeShort.toNumber() / 1e10,
  block: pairGroup.block,
});

export const convertPairBorrowingFee = (
  pair: GNSBorrowingFeesInterfaceV6_3_2.PairStructOutput
): BorrowingFee.Pair => ({
  feePerBlock: pair.feePerBlock / 1e10,
  accFeeLong: pair.accFeeLong.toNumber() / 1e10,
  accFeeShort: pair.accFeeShort.toNumber() / 1e10,
  accLastUpdatedBlock: pair.accLastUpdatedBlock,
  lastAccBlockWeightedMarketCap:
    pair.lastAccBlockWeightedMarketCap.toNumber() / 1e40,
  groups: pair.groups.map(value => convertPairGroupBorrowingFee(value)),
});
export const convertPairBorrowingFees = (
  pairs: GNSBorrowingFeesInterfaceV6_3_2.PairStructOutput[]
): BorrowingFee.Pair[] => pairs.map(value => convertPairBorrowingFee(value));

export const convertGroupBorrowingFee = (
  group: GNSBorrowingFeesInterfaceV6_3_2.GroupStructOutput
): BorrowingFee.Group => ({
  oiLong: group.oiLong.toNumber() / 1e10,
  oiShort: group.oiShort.toNumber() / 1e10,
  feePerBlock: group.feePerBlock / 1e10,
  accFeeLong: group.accFeeLong.toNumber() / 1e10,
  accFeeShort: group.accFeeShort.toNumber() / 1e10,
  accLastUpdatedBlock: group.accLastUpdatedBlock,
  lastAccBlockWeightedMarketCap:
    group.lastAccBlockWeightedMarketCap.toNumber() / 1e40,
  maxOi: group.maxOi.toNumber() / 1e10,
});
export const convertGroupBorrowingFees = (
  groups: GNSBorrowingFeesInterfaceV6_3_2.GroupStructOutput[]
): BorrowingFee.Group[] => groups.map(value => convertGroupBorrowingFee(value));
