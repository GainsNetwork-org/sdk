/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Pair, Fee, OpenInterest, PairDepth } from "@/trade/types";
import { Contracts } from "@/contracts/types";

export const fetchPairs = async (
  contracts: Contracts,
  pairIxs: number[]
): Promise<Pair[]> => {
  if (!contracts) {
    return [];
  }

  const { gnsMultiCollatDiamond: multiCollatContract } = contracts;

  try {
    const pairs = await Promise.all(
      pairIxs.map(pairIndex => multiCollatContract.pairs(pairIndex))
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

export const fetchPairDepths = async (
  contracts: Contracts,
  pairIxs: number[]
): Promise<PairDepth[]> => {
  if (!contracts) {
    return [];
  }

  const { gnsMultiCollatDiamond: multiCollatContract } = contracts;

  try {
    const pairParams = await multiCollatContract.getPairDepths(pairIxs);

    return pairParams.map(pair => {
      return {
        onePercentDepthAboveUsd: parseFloat(
          pair.onePercentDepthAboveUsd.toString()
        ),
        onePercentDepthBelowUsd: parseFloat(
          pair.onePercentDepthBelowUsd.toString()
        ),
      } as PairDepth;
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

  const { gnsMultiCollatDiamond: multiCollatContract } = contracts;

  try {
    const fees = await Promise.all(
      feeIxs.map(pairIndex => multiCollatContract.fees(pairIndex))
    );

    return fees.map(fee => {
      return {
        closeFeeP: parseFloat(fee.closeFeeP.toString()) / 1e12,
        minLevPosUsd: parseFloat(fee.minLevPosUsd.toString()) / 1e18,
        nftLimitOrderFeeP: parseFloat(fee.nftLimitOrderFeeP.toString()) / 1e12,
        openFeeP: parseFloat(fee.openFeeP.toString()) / 1e12,
      } as Fee;
    });
  } catch (error) {
    console.error(`Unexpected error while fetching pairs!`);
    throw error;
  }
};

export const fetchOpenInterest = async (
  contracts: Contracts,
  pairIxs: number[]
): Promise<OpenInterest[]> => {
  const { precision: collateralPrecision } =
    await contracts.gnsBorrowingFees.collateralConfig();
  const openInterests = await Promise.all(
    pairIxs.map(pairIndex =>
      Promise.all([
        contracts.gfarmTradingStorageV5.openInterestDai(pairIndex, 0),
        contracts.gfarmTradingStorageV5.openInterestDai(pairIndex, 1),
        contracts.gnsBorrowingFees.getPairMaxOi(pairIndex),
      ])
    )
  );

  const precision = parseFloat(collateralPrecision.toString());
  return openInterests.map(openInterest => ({
    long: parseFloat(openInterest[0].toString()) / precision,
    short: parseFloat(openInterest[1].toString()) / precision,
    max: parseFloat(openInterest[2].toString()) / 1e10,
  }));
};
