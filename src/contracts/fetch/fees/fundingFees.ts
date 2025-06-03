import type { GNSMultiCollatDiamond } from "../../types/generated";
import type { TradeInitialAccFees } from "../../../trade/fees/fundingFees";

/**
 * @dev Fetches pending accumulated funding fees for a specific pair
 * @param contract GNSMultiCollatDiamond contract instance
 * @param collateralIndex Collateral index
 * @param pairIndex Pair index
 * @param currentPairPrice Current pair price (1e10)
 * @returns Promise resolving to accumulated funding fees and current rate
 */
export const fetchPairPendingAccFundingFees = async (
  contract: GNSMultiCollatDiamond,
  collateralIndex: number,
  pairIndex: number,
  currentPairPrice: bigint
): Promise<{
  accFundingFeeLongP: number;
  accFundingFeeShortP: number;
  currentFundingRatePerSecondP: number;
}> => {
  try {
    const result = await contract.getPairPendingAccFundingFees(
      collateralIndex,
      pairIndex,
      currentPairPrice
    );

    return {
      accFundingFeeLongP: Number(result.accFundingFeeLongP) / 1e20, // ACC_FUNDING_FEE_P precision
      accFundingFeeShortP: Number(result.accFundingFeeShortP) / 1e20,
      currentFundingRatePerSecondP:
        Number(result.currentFundingRatePerSecondP) / 1e18, // FUNDING_RATE_PER_SECOND_P precision
    };
  } catch (error) {
    console.error("Error fetching pair pending acc funding fees:", error);
    throw error;
  }
};

/**
 * @dev Fetches funding fees for a specific trade in collateral tokens
 * @param contract GNSMultiCollatDiamond contract instance
 * @param trader Trader address
 * @param index Trade index
 * @param currentPairPrice Current pair price (1e10)
 * @returns Promise resolving to funding fee in collateral tokens
 */
export const fetchTradeFundingFeesCollateral = async (
  contract: GNSMultiCollatDiamond,
  trader: string,
  index: number,
  currentPairPrice: bigint
): Promise<number> => {
  try {
    const fundingFeeCollateral = await contract.getTradeFundingFeesCollateral(
      trader,
      index,
      currentPairPrice
    );

    // Convert from BigNumber to number (collateral precision already applied)
    return Number(fundingFeeCollateral);
  } catch (error) {
    console.error("Error fetching trade funding fees:", error);
    throw error;
  }
};

/**
 * @dev Fetches trade fees data for a specific trade
 * @param contract GNSMultiCollatDiamond contract instance
 * @param trader Trader address
 * @param index Trade index
 * @returns Promise resolving to trade fees data
 */
export const fetchTradeFeesData = async (
  contract: GNSMultiCollatDiamond,
  trader: string,
  index: number
): Promise<TradeInitialAccFees> => {
  try {
    const feesData = await contract.getTradeFeesData(trader, index);

    return {
      accPerOiLong: Number(feesData.initialAccFundingFeeP) / 1e20, // Convert from int128 with ACC_FUNDING_FEE_P precision
      accPerOiShort: Number(feesData.initialAccFundingFeeP) / 1e20, // Same value for both (trade specific)
      openBlock: 0, // Not available in this struct
    };
  } catch (error) {
    console.error("Error fetching trade fees data:", error);
    throw error;
  }
};

/**
 * @dev Fetches trade fees data for multiple trades
 * @param contract GNSMultiCollatDiamond contract instance
 * @param traders Array of trader addresses
 * @param indices Array of trade indices
 * @returns Promise resolving to array of trade fees data
 */
export const fetchTradeFeesDataBatch = async (
  contract: GNSMultiCollatDiamond,
  traders: string[],
  indices: number[]
): Promise<TradeInitialAccFees[]> => {
  if (traders.length !== indices.length) {
    throw new Error("Traders and indices arrays must have the same length");
  }

  try {
    const feesDatas = await contract.getTradeFeesDataArray(traders, indices);

    return feesDatas.map(feesData => ({
      accPerOiLong: Number(feesData.initialAccFundingFeeP) / 1e20,
      accPerOiShort: Number(feesData.initialAccFundingFeeP) / 1e20,
      openBlock: 0,
    }));
  } catch (error) {
    console.error("Error fetching trade fees data batch:", error);
    throw error;
  }
};

/**
 * @dev Fetches pending accumulated funding fees for multiple pairs
 * @param contract GNSMultiCollatDiamond contract instance
 * @param collateralIndices Array of collateral indices
 * @param pairIndices Array of pair indices
 * @param currentPairPrices Array of current pair prices (1e10)
 * @returns Promise resolving to array of accumulated funding fees
 */
export const fetchPairPendingAccFundingFeesBatch = async (
  contract: GNSMultiCollatDiamond,
  collateralIndices: number[],
  pairIndices: number[],
  currentPairPrices: bigint[]
): Promise<
  Array<{
    accFundingFeeLongP: number;
    accFundingFeeShortP: number;
    currentFundingRatePerSecondP: number;
  }>
> => {
  if (
    collateralIndices.length !== pairIndices.length ||
    pairIndices.length !== currentPairPrices.length
  ) {
    throw new Error("All input arrays must have the same length");
  }

  try {
    // Fetch all in parallel
    const promises = collateralIndices.map((collateralIndex, i) =>
      contract.getPairPendingAccFundingFees(
        collateralIndex,
        pairIndices[i],
        currentPairPrices[i]
      )
    );

    const results = await Promise.all(promises);

    return results.map(result => ({
      accFundingFeeLongP: Number(result.accFundingFeeLongP) / 1e20,
      accFundingFeeShortP: Number(result.accFundingFeeShortP) / 1e20,
      currentFundingRatePerSecondP:
        Number(result.currentFundingRatePerSecondP) / 1e18,
    }));
  } catch (error) {
    console.error("Error fetching pair pending acc funding fees batch:", error);
    throw error;
  }
};

/**
 * @dev Helper to convert price from number to contract format
 * @param price Price as number
 * @returns Price in contract format (1e10)
 */
export const priceToContractFormat = (price: number): bigint => {
  return BigInt(Math.round(price * 1e10));
};

/**
 * @dev Helper to convert collateral amount to contract format
 * @param amount Amount as number
 * @param decimals Collateral decimals (6 for USDC, 18 for others)
 * @returns Amount in contract format
 */
export const collateralToContractFormat = (
  amount: number,
  decimals: number
): bigint => {
  return BigInt(Math.round(amount * 10 ** decimals));
};
