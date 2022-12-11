/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Pair, PairParams, PairRolloverFees, Fee } from "@/trade/types";
import {
  GFarmTradingStorageV5,
  GNSPairInfosV6_1,
  GNSPairsStorageV6,
} from "../types/generated";

import { Contracts } from "@/contracts/types";

export const fetchPairs = async (
  contracts: Contracts,
  pairIxs: number[]
): Promise<Pair[]> => {
  if (!contracts) {
    return [];
  }

  const { gnsPairsStorageV6: pairsStorageContract } = contracts;

  try {
    const pairs = await Promise.all(
      pairIxs.map(
        (pairIndex) => pairsStorageContract.pairs(pairIndex)
      )
    );

    return pairs.map((pair, index) => {
      return {
        name: pair.from + "/" + pair.to,
        from: pair.from,
        to: pair.to,
        feeIndex: parseInt(pair.feeIndex.toString()),
        groupIndex: parseInt(pair.groupIndex.toString()),
        pairIndex: pairIxs[index],
        spreadP: parseFloat(pair.spreadP.toString()) / 1e12,
      } as Pair;
    });

  } catch (error) {
    console.error(`Unexpected error while fetching pairs!`);

    throw error;
  }
};

export const fetchPairsParams = async (
  contracts: Contracts,
  pairIxs: number[]
): Promise<PairParams[]> => {
  if (!contracts) {
    return [];
  }

  const { gnsPairInfosV6_1: pairInfosContract } = contracts;

  try {
    const pairParams = await Promise.all(
      pairIxs.map(
        (pairIndex) => pairInfosContract.pairParams(pairIndex)
      )
    );

    return pairParams.map((pair) => {
      return {
        onePercentDepthAbove: parseFloat(pair.onePercentDepthAbove.toString()),
        onePercentDepthBelow: parseFloat(pair.onePercentDepthBelow.toString()),
        rolloverFeePerBlockP: parseFloat(pair.rolloverFeePerBlockP.toString()) / 1e12,
        fundingFeePerBlockP: parseFloat(pair.fundingFeePerBlockP.toString()) / 1e12,
      } as PairParams;
    });

  } catch (error) {
    console.error(`Unexpected error while fetching pairs!`);

    throw error;
  }
};

export const fetchPairsRolloverFees = async (
  contracts: Contracts,
  pairIxs: number[]
): Promise<PairRolloverFees[]> => {
  if (!contracts) {
    return [];
  }

  const { gnsPairInfosV6_1: pairInfosContract } = contracts;

  try {
    const pairsRolloverFees = await Promise.all(
      pairIxs.map(
        (pairIndex) => pairInfosContract.pairRolloverFees(pairIndex)
      )
    );

    return pairsRolloverFees.map((pairData) => {
      return {
        accPerCollateral: parseFloat(pairData.accPerCollateral.toString()) / 1e18,
        lastUpdateBlock: parseInt(pairData.lastUpdateBlock.toString()),
      } as PairRolloverFees;
    });

  } catch (error) {
    console.error(`Unexpected error while fetching pairs!`);

    throw error;
  }
};

export const fetchFees = async (
  contracts: Contracts,
  feeIxs: number[]
): Promise<Fee[]> => {
  if (!contracts) {
    return [];
  }

  const { gnsPairsStorageV6: pairsStorageContract } = contracts;

  try {
    const fees = await Promise.all(
      feeIxs.map(
        (pairIndex) => pairsStorageContract.fees(pairIndex)
      )
    );

    return fees.map((fee) => {
      return {
        closeFeeP: parseFloat(fee.closeFeeP.toString()) / 1e12,
        minLevPosDai: parseFloat(fee.minLevPosDai.toString()) / 1e12,
        nftLimitOrderFeeP: parseFloat(fee.nftLimitOrderFeeP.toString()) / 1e12,
        openFeeP: parseFloat(fee.openFeeP.toString()) / 1e12,
        referralFeeP: parseFloat(fee.referralFeeP.toString()) / 1e12,
      } as Fee;
    });

  } catch (error) {
    console.error(`Unexpected error while fetching pairs!`);

    throw error;
  }
};