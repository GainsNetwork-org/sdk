import { GNSBorrowingFeesInterfaceV6_3_2 } from "@/contracts/types/generated/GNSBorrowingFeesV6_3_2";
import { BorrowingFee } from ".";

export const convertPairGroupBorrowingFee = (
  pairGroup: GNSBorrowingFeesInterfaceV6_3_2.PairGroupStructOutput
): BorrowingFee.PairGroup => ({
  groupIndex: pairGroup.groupIndex,
  initialAccFeeLong: parseFloat(pairGroup.initialAccFeeLong.toString()) / 1e10,
  initialAccFeeShort:
    parseFloat(pairGroup.initialAccFeeShort.toString()) / 1e10,
  prevGroupAccFeeLong:
    parseFloat(pairGroup.prevGroupAccFeeLong.toString()) / 1e10,
  prevGroupAccFeeShort:
    parseFloat(pairGroup.prevGroupAccFeeShort.toString()) / 1e10,
  pairAccFeeLong: parseFloat(pairGroup.pairAccFeeLong.toString()) / 1e10,
  pairAccFeeShort: parseFloat(pairGroup.pairAccFeeShort.toString()) / 1e10,
  block: pairGroup.block,
});

export const convertPairBorrowingFee = (
  pair: GNSBorrowingFeesInterfaceV6_3_2.PairStructOutput
): BorrowingFee.Pair => ({
  feePerBlock: pair.feePerBlock / 1e10,
  accFeeLong: parseFloat(pair.accFeeLong.toString()) / 1e10,
  accFeeShort: parseFloat(pair.accFeeShort.toString()) / 1e10,
  accLastUpdatedBlock: pair.accLastUpdatedBlock,
  lastAccBlockWeightedMarketCap:
    parseFloat(pair.lastAccBlockWeightedMarketCap.toString()) / 1e40,
  groups: pair.groups.map(value => convertPairGroupBorrowingFee(value)),
});
export const convertPairBorrowingFees = (
  pairs: GNSBorrowingFeesInterfaceV6_3_2.PairStructOutput[]
): BorrowingFee.Pair[] => pairs.map(value => convertPairBorrowingFee(value));

export const convertGroupBorrowingFee = (
  group: GNSBorrowingFeesInterfaceV6_3_2.GroupStructOutput
): BorrowingFee.Group => ({
  oiLong: parseFloat(group.oiLong.toString()) / 1e10,
  oiShort: parseFloat(group.oiShort.toString()) / 1e10,
  feePerBlock: group.feePerBlock / 1e10,
  accFeeLong: parseFloat(group.accFeeLong.toString()) / 1e10,
  accFeeShort: parseFloat(group.accFeeShort.toString()) / 1e10,
  accLastUpdatedBlock: group.accLastUpdatedBlock,
  lastAccBlockWeightedMarketCap:
    parseFloat(group.lastAccBlockWeightedMarketCap.toString()) / 1e40,
  maxOi: parseFloat(group.maxOi.toString()) / 1e10,
});
export const convertGroupBorrowingFees = (
  groups: GNSBorrowingFeesInterfaceV6_3_2.GroupStructOutput[]
): BorrowingFee.Group[] => groups.map(value => convertGroupBorrowingFee(value));
