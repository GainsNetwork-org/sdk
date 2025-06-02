import type { GNSMultiCollatDiamond } from "../types/generated";
import { BorrowingFeeV2 } from "../../trade/fees/borrowingV2";
import {
  convertBorrowingFeeParamsArray as convertBorrowingFeeParamsArrayV2,
  convertPairBorrowingFeeDataArray as convertPairBorrowingFeeDataArrayV2,
} from "../../trade/fees/borrowingV2/converter";

/**
 * @dev Fetches borrowing fee parameters v2 for specific pairs
 * @param contract GNSMultiCollatDiamond contract instance
 * @param collateralIndices Array of collateral indices
 * @param pairIndices Array of pair indices
 * @returns Promise resolving to array of borrowing fee parameters
 */
export const fetchBorrowingFeeParamsV2 = async (
  contract: GNSMultiCollatDiamond,
  collateralIndices: number[],
  pairIndices: number[]
): Promise<BorrowingFeeV2.BorrowingFeeParams[]> => {
  if (collateralIndices.length !== pairIndices.length) {
    throw new Error(
      "Collateral indices and pair indices arrays must have the same length"
    );
  }

  try {
    const contractParams = await contract.getPairBorrowingFeeParams(
      collateralIndices,
      pairIndices
    );

    return convertBorrowingFeeParamsArrayV2(contractParams);
  } catch (error) {
    console.error("Error fetching borrowing fee params v2:", error);
    throw error;
  }
};

/**
 * @dev Fetches pair borrowing fee data v2 for specific pairs
 * @param contract GNSMultiCollatDiamond contract instance
 * @param collateralIndices Array of collateral indices
 * @param pairIndices Array of pair indices
 * @returns Promise resolving to array of pair borrowing fee data
 */
export const fetchPairBorrowingFeeDataV2 = async (
  contract: GNSMultiCollatDiamond,
  collateralIndices: number[],
  pairIndices: number[]
): Promise<BorrowingFeeV2.PairBorrowingFeeData[]> => {
  if (collateralIndices.length !== pairIndices.length) {
    throw new Error(
      "Collateral indices and pair indices arrays must have the same length"
    );
  }

  try {
    const contractData = await contract.getPairBorrowingFeeData(
      collateralIndices,
      pairIndices
    );

    return convertPairBorrowingFeeDataArrayV2(contractData);
  } catch (error) {
    console.error("Error fetching pair borrowing fee data v2:", error);
    throw error;
  }
};

/**
 * @dev Fetches borrowing fees in collateral tokens for a specific trade
 * @param contract GNSMultiCollatDiamond contract instance
 * @param trader Address of the trader
 * @param index Trade index
 * @param currentPairPrice Current price of the trading pair (1e6 precision)
 * @returns Promise resolving to borrowing fees in collateral tokens
 */
export const fetchTradeBorrowingFeesCollateralV2 = async (
  contract: GNSMultiCollatDiamond,
  trader: string,
  index: number,
  currentPairPrice: number
): Promise<number> => {
  try {
    const feesCollateral = await contract.getTradeBorrowingFeesCollateral(
      trader,
      index,
      currentPairPrice
    );

    // Convert BigNumber to normalized float
    // Note: Collateral precision varies by chain, but contract returns proper precision
    return parseFloat(feesCollateral.toString());
  } catch (error) {
    console.error("Error fetching trade borrowing fees collateral v2:", error);
    throw error;
  }
};

/**
 * @dev Fetches pending accumulated borrowing fees for a specific pair
 * @param contract GNSMultiCollatDiamond contract instance
 * @param collateralIndex Index of the collateral
 * @param pairIndex Index of the trading pair
 * @param currentPairPrice Current price of the trading pair (1e6 precision)
 * @returns Promise resolving to pending accumulated borrowing fee
 */
export const fetchPairPendingAccBorrowingFeesV2 = async (
  contract: GNSMultiCollatDiamond,
  collateralIndex: number,
  pairIndex: number,
  currentPairPrice: number
): Promise<number> => {
  try {
    const accBorrowingFeeP = await contract.getPairPendingAccBorrowingFees(
      collateralIndex,
      pairIndex,
      currentPairPrice
    );

    // Convert BigNumber to normalized float
    return parseFloat(accBorrowingFeeP.toString()) / 1e20;
  } catch (error) {
    console.error("Error fetching pair pending acc borrowing fees v2:", error);
    throw error;
  }
};

/**
 * @dev Convenience function to fetch all borrowing v2 data for specific pairs
 * @param contract GNSMultiCollatDiamond contract instance
 * @param collateralIndex Index of the collateral
 * @param pairIndices Array of pair indices
 * @returns Promise resolving to complete borrowing v2 data set
 */
export const fetchAllBorrowingV2Data = async (
  contract: GNSMultiCollatDiamond,
  collateralIndex: number,
  pairIndices: number[]
): Promise<{
  params: BorrowingFeeV2.BorrowingFeeParams[];
  data: BorrowingFeeV2.PairBorrowingFeeData[];
  context: BorrowingFeeV2.GetBorrowingFeeV2Context;
}> => {
  const collateralIndices = new Array(pairIndices.length).fill(collateralIndex);

  try {
    // Fetch both parameters and data in parallel
    const [params, data] = await Promise.all([
      fetchBorrowingFeeParamsV2(contract, collateralIndices, pairIndices),
      fetchPairBorrowingFeeDataV2(contract, collateralIndices, pairIndices),
    ]);

    // Create context from fetched data
    const context = createBorrowingV2ContextFromArrays(
      collateralIndices,
      pairIndices,
      params,
      data
    );

    return { params, data, context };
  } catch (error) {
    console.error("Error fetching all borrowing v2 data:", error);
    throw error;
  }
};

/**
 * @dev Creates a complete borrowing v2 context from contract data
 * @param contract GNSMultiCollatDiamond contract instance
 * @param collateralIndex Index of the collateral
 * @param pairIndices Array of pair indices
 * @param currentTimestamp Optional current timestamp for calculations
 * @returns Promise resolving to complete borrowing v2 context
 */
export const createBorrowingV2ContextFromContract = async (
  contract: GNSMultiCollatDiamond,
  collateralIndex: number,
  pairIndices: number[],
  currentTimestamp?: number
): Promise<BorrowingFeeV2.GetBorrowingFeeV2Context> => {
  const { context } = await fetchAllBorrowingV2Data(
    contract,
    collateralIndex,
    pairIndices
  );

  return {
    ...context,
    currentTimestamp: currentTimestamp ?? Math.floor(Date.now() / 1000),
  };
};

/**
 * @dev Helper function to create context from already fetched arrays
 * @param collateralIndices Array of collateral indices
 * @param pairIndices Array of pair indices
 * @param params Array of borrowing fee parameters
 * @param data Array of pair borrowing fee data
 * @param currentTimestamp Optional current timestamp
 * @returns Complete borrowing v2 context
 */
export const createBorrowingV2ContextFromArrays = (
  collateralIndices: number[],
  pairIndices: number[],
  params: BorrowingFeeV2.BorrowingFeeParams[],
  data: BorrowingFeeV2.PairBorrowingFeeData[],
  currentTimestamp?: number
): BorrowingFeeV2.GetBorrowingFeeV2Context => {
  const context: BorrowingFeeV2.GetBorrowingFeeV2Context = {
    currentTimestamp: currentTimestamp ?? Math.floor(Date.now() / 1000),
    borrowingParams: {},
    borrowingData: {},
  };

  // Build nested objects indexed by collateralIndex and pairIndex
  for (let i = 0; i < collateralIndices.length; i++) {
    const collateralIndex = collateralIndices[i];
    const pairIndex = pairIndices[i];

    // Initialize collateral index objects if they don't exist
    if (!context.borrowingParams[collateralIndex]) {
      context.borrowingParams[collateralIndex] = {};
    }
    if (!context.borrowingData[collateralIndex]) {
      context.borrowingData[collateralIndex] = {};
    }

    // Store data
    context.borrowingParams[collateralIndex][pairIndex] = params[i];
    context.borrowingData[collateralIndex][pairIndex] = data[i];
  }

  return context;
};

/**
 * @dev Fetches borrowing v2 data for multiple collateral/pair combinations
 * @param contract GNSMultiCollatDiamond contract instance
 * @param collateralIndices Array of collateral indices
 * @param pairIndices Array of pair indices (must match collateralIndices length)
 * @returns Promise resolving to complete borrowing v2 context
 */
export const fetchBorrowingV2DataForPairs = async (
  contract: GNSMultiCollatDiamond,
  collateralIndices: number[],
  pairIndices: number[]
): Promise<BorrowingFeeV2.GetBorrowingFeeV2Context> => {
  if (collateralIndices.length !== pairIndices.length) {
    throw new Error(
      "Collateral indices and pair indices arrays must have the same length"
    );
  }

  try {
    // Fetch both parameters and data in parallel
    const [params, data] = await Promise.all([
      fetchBorrowingFeeParamsV2(contract, collateralIndices, pairIndices),
      fetchPairBorrowingFeeDataV2(contract, collateralIndices, pairIndices),
    ]);

    // Create and return context
    return createBorrowingV2ContextFromArrays(
      collateralIndices,
      pairIndices,
      params,
      data
    );
  } catch (error) {
    console.error("Error fetching borrowing v2 data for pairs:", error);
    throw error;
  }
};
