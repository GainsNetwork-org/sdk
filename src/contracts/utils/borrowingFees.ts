import { GNSMultiCollatDiamond } from "../types/generated";
import {
  BorrowingFee,
  convertGroupBorrowingFees,
  convertPairBorrowingFees,
} from "../../trade";

export const getBorrowingGroupName = (groupIndex: number): string => {
  const groupNamesByIndex = [
    "Crypto Core",
    "Crypto Altcoins",
    "Forex USD Majors",
    "Forex USD-Quoted Majors",
    "Forex EUR Majors",
    "",
    "",
    "Commodities",
    "Forex USD Minors",
    "Forex Nordic",
    "Forex GBP Majors",
    "Forex AUD",
    "Forex NZD",
  ];
  return groupNamesByIndex[groupIndex - 1] || "Unknown";
};

export const fetchAllPairBorrowingFees = async (
  contract: GNSMultiCollatDiamond,
  collateralIndex: number
): Promise<BorrowingFee.Pair[]> =>
  convertPairBorrowingFees(
    await contract.getAllBorrowingPairs(collateralIndex)
  );

export const fetchGroupBorrowingFees = async (
  contract: GNSMultiCollatDiamond,
  collateralIndex: number,
  groupIxs: number[]
): Promise<BorrowingFee.Group[]> =>
  convertGroupBorrowingFees(
    await contract.getBorrowingGroups(collateralIndex, groupIxs)
  );

export const fetchAllPairAndGroupBorrowingFees = async (
  contract: GNSMultiCollatDiamond,
  collateralIndex: number
): Promise<{
  pairs: BorrowingFee.Pair[];
  groups: BorrowingFee.Group[];
}> => {
  const pairs = await fetchAllPairBorrowingFees(contract, collateralIndex);

  const groupIxs = [
    ...new Set(
      pairs
        .map(value => value.groups.map(value => value.groupIndex))
        .reduce((acc, value) => acc.concat(value), [])
    ),
  ].sort((a, b) => a - b);
  const groups = await fetchGroupBorrowingFees(
    contract,
    collateralIndex,
    groupIxs
  );
  return { pairs, groups };
};
