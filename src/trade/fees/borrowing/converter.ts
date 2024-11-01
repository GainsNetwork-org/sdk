import { IBorrowingFees } from "../../../contracts/types/generated/GNSMultiCollatDiamond";
import { BorrowingFee } from ".";
import { getBorrowingGroupName } from "../../../contracts/utils/borrowingFees";

export const convertPairGroupBorrowingFee = (
  pairGroup: IBorrowingFees.BorrowingPairGroupStructOutput
): BorrowingFee.PairGroup => ({
  groupIndex: pairGroup.groupIndex,
  name: getBorrowingGroupName(pairGroup.groupIndex),
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
  pair: IBorrowingFees.BorrowingDataStructOutput,
  pairOi: IBorrowingFees.OpenInterestStructOutput,
  pairGroup: IBorrowingFees.BorrowingPairGroupStructOutput[]
): BorrowingFee.Pair => ({
  ...convertGroupBorrowingData(pair, pairOi),
  groups: pairGroup.map(value => convertPairGroupBorrowingFee(value)),
});

export const convertPairBorrowingFees = ([pairs, pairOi, pairGroups]: [
  IBorrowingFees.BorrowingDataStructOutput[],
  IBorrowingFees.OpenInterestStructOutput[],
  IBorrowingFees.BorrowingPairGroupStructOutput[][]
]): BorrowingFee.Pair[] =>
  pairs.map((value, ix) =>
    convertPairBorrowingFee(value, pairOi[ix], pairGroups[ix])
  );

export const convertGroupBorrowingFee = (
  group: IBorrowingFees.BorrowingDataStructOutput,
  groupOi: IBorrowingFees.OpenInterestStructOutput
): BorrowingFee.Group => convertGroupBorrowingData(group, groupOi);

export const convertGroupBorrowingData = (
  obj: IBorrowingFees.BorrowingDataStructOutput,
  oi: IBorrowingFees.OpenInterestStructOutput
): BorrowingFee.BorrowingData & BorrowingFee.BorrowingOi => ({
  oi: {
    long: parseFloat(oi.long.toString()) / 1e10,
    short: parseFloat(oi.short.toString()) / 1e10,
    max: parseFloat(oi.max.toString()) / 1e10,
  },
  feePerBlock: obj.feePerBlock / 1e10,
  accFeeLong: parseFloat(obj.accFeeLong.toString()) / 1e10,
  accFeeShort: parseFloat(obj.accFeeShort.toString()) / 1e10,
  accLastUpdatedBlock: obj.accLastUpdatedBlock,
  feeExponent: obj.feeExponent,
});

export const convertGroupBorrowingFees = ([groups, groupOis]: [
  IBorrowingFees.BorrowingDataStructOutput[],
  IBorrowingFees.OpenInterestStructOutput[]
]): BorrowingFee.Group[] =>
  groups.map((value, ix) => convertGroupBorrowingFee(value, groupOis[ix]));
