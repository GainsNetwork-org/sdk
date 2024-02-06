import { IGNSBorrowingFees } from "../../../contracts/types/generated/GNSBorrowingFees";
import { BorrowingFee } from ".";

export const convertPairGroupBorrowingFee = (
  pairGroup: IGNSBorrowingFees.PairGroupStructOutput
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
  pair: IGNSBorrowingFees.PairStructOutput,
  pairOi: IGNSBorrowingFees.PairOiStructOutput
): BorrowingFee.Pair => ({
  feePerBlock: pair.feePerBlock / 1e10,
  accFeeLong: parseFloat(pair.accFeeLong.toString()) / 1e10,
  accFeeShort: parseFloat(pair.accFeeShort.toString()) / 1e10,
  accLastUpdatedBlock: pair.accLastUpdatedBlock,
  lastAccBlockWeightedMarketCap:
    parseFloat(pair.lastAccBlockWeightedMarketCap.toString()) / 1e40,
  groups: pair.groups.map(value => convertPairGroupBorrowingFee(value)),
  feeExponent: pair.feeExponent,
  maxOi: parseFloat(pairOi.max.toString()) / 1e10,
});
export const convertPairBorrowingFees = ([pairs, pairOi]: [
  IGNSBorrowingFees.PairStructOutput[],
  IGNSBorrowingFees.PairOiStructOutput[]
]): BorrowingFee.Pair[] =>
  pairs.map((value, ix) => convertPairBorrowingFee(value, pairOi[ix]));

export const convertGroupBorrowingFee = (
  group: IGNSBorrowingFees.GroupStructOutput,
  groupFeeExponent: number
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
  feeExponent: groupFeeExponent,
});
export const convertGroupBorrowingFees = ([groups, groupFeeExponents]: [
  IGNSBorrowingFees.GroupStructOutput[],
  number[]
]): BorrowingFee.Group[] =>
  groups.map((value, ix) =>
    convertGroupBorrowingFee(value, groupFeeExponents[ix])
  );
