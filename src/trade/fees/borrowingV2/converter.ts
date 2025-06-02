import type { IFundingFees } from "../../../contracts/types/generated/GNSMultiCollatDiamond";
import { BorrowingFeeV2 } from ".";
import { BORROWING_V2_PRECISION } from "./index";

/**
 * @dev Converts contract BorrowingFeeParams to SDK type
 * @param contractParams Contract borrowing fee params from IFundingFees.BorrowingFeeParams
 * @returns SDK BorrowingFeeParams
 */
export const convertBorrowingFeeParams = (
  contractParams: IFundingFees.BorrowingFeeParamsStructOutput
): BorrowingFeeV2.BorrowingFeeParams => ({
  borrowingRatePerSecondP: contractParams.borrowingRatePerSecondP / BORROWING_V2_PRECISION.RATE_PER_SECOND,
});

/**
 * @dev Converts array of contract BorrowingFeeParams to SDK types
 * @param contractParamsArray Array of contract borrowing fee params
 * @returns Array of SDK BorrowingFeeParams
 */
export const convertBorrowingFeeParamsArray = (
  contractParamsArray: IFundingFees.BorrowingFeeParamsStructOutput[]
): BorrowingFeeV2.BorrowingFeeParams[] =>
  contractParamsArray.map(params => convertBorrowingFeeParams(params));

/**
 * @dev Converts contract PairBorrowingFeeData to SDK type
 * @param contractData Contract pair borrowing fee data from IFundingFees.PairBorrowingFeeData
 * @returns SDK PairBorrowingFeeData
 */
export const convertPairBorrowingFeeData = (
  contractData: IFundingFees.PairBorrowingFeeDataStructOutput
): BorrowingFeeV2.PairBorrowingFeeData => ({
  accBorrowingFeeP: parseFloat(contractData.accBorrowingFeeP.toString()) / BORROWING_V2_PRECISION.ACC_FEE,
  lastBorrowingUpdateTs: contractData.lastBorrowingUpdateTs,
});

/**
 * @dev Converts array of contract PairBorrowingFeeData to SDK types
 * @param contractDataArray Array of contract pair borrowing fee data
 * @returns Array of SDK PairBorrowingFeeData
 */
export const convertPairBorrowingFeeDataArray = (
  contractDataArray: IFundingFees.PairBorrowingFeeDataStructOutput[]
): BorrowingFeeV2.PairBorrowingFeeData[] =>
  contractDataArray.map(data => convertPairBorrowingFeeData(data));

/**
 * @dev Converts contract TradeFeesData to SDK TradeInitialAccFees
 * @param contractTradeData Contract trade fees data from IFundingFees.TradeFeesData
 * @returns SDK TradeInitialAccFees
 */
export const convertTradeInitialAccFees = (
  contractTradeData: IFundingFees.TradeFeesDataStructOutput
): BorrowingFeeV2.TradeInitialAccFees => ({
  initialAccBorrowingFeeP: parseFloat(contractTradeData.initialAccBorrowingFeeP.toString()) / BORROWING_V2_PRECISION.ACC_FEE,
});

/**
 * @dev Converts array of contract TradeFeesData to SDK TradeInitialAccFees
 * @param contractTradeDataArray Array of contract trade fees data
 * @returns Array of SDK TradeInitialAccFees
 */
export const convertTradeInitialAccFeesArray = (
  contractTradeDataArray: IFundingFees.TradeFeesDataStructOutput[]
): BorrowingFeeV2.TradeInitialAccFees[] =>
  contractTradeDataArray.map(data => convertTradeInitialAccFees(data));

/**
 * @dev Creates a context object from contract data arrays
 * @param collateralIndices Array of collateral indices
 * @param pairIndices Array of pair indices
 * @param borrowingParams Array of borrowing fee params from contract
 * @param borrowingData Array of pair borrowing fee data from contract
 * @param currentTimestamp Optional current timestamp
 * @returns Complete SDK context for borrowing v2 calculations
 */
export const createBorrowingV2Context = (
  collateralIndices: number[],
  pairIndices: number[],
  borrowingParams: IFundingFees.BorrowingFeeParamsStructOutput[],
  borrowingData: IFundingFees.PairBorrowingFeeDataStructOutput[],
  currentTimestamp?: number
): BorrowingFeeV2.GetBorrowingFeeV2Context => {
  const context: BorrowingFeeV2.GetBorrowingFeeV2Context = {
    currentTimestamp,
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

    // Store converted data
    context.borrowingParams[collateralIndex][pairIndex] = 
      convertBorrowingFeeParams(borrowingParams[i]);
    context.borrowingData[collateralIndex][pairIndex] = 
      convertPairBorrowingFeeData(borrowingData[i]);
  }

  return context;
};

/**
 * @dev Helper function to validate borrowing rate per second
 * @param borrowingRatePerSecondP Borrowing rate per second (normalized float)
 * @returns True if rate is within valid bounds
 */
export const isValidBorrowingRate = (borrowingRatePerSecondP: number): boolean => {
  return borrowingRatePerSecondP >= 0 && borrowingRatePerSecondP <= (317097 / BORROWING_V2_PRECISION.RATE_PER_SECOND); // Max 1,000% APR
};

/**
 * @dev Helper function to convert borrowing rate to APR percentage
 * @param borrowingRatePerSecondP Borrowing rate per second (normalized float)
 * @returns APR as percentage (e.g., 10.5 for 10.5% APR)
 */
export const borrowingRateToAPR = (borrowingRatePerSecondP: number): number => {
  const SECONDS_PER_YEAR = 365 * 24 * 60 * 60; // 31,536,000
  return borrowingRatePerSecondP * SECONDS_PER_YEAR;
};

/**
 * @dev Helper function to convert APR percentage to borrowing rate per second
 * @param aprPercentage APR as percentage (e.g., 10.5 for 10.5% APR)
 * @returns Borrowing rate per second (normalized float)
 */
export const aprToBorrowingRate = (aprPercentage: number): number => {
  const SECONDS_PER_YEAR = 365 * 24 * 60 * 60; // 31,536,000
  return aprPercentage / SECONDS_PER_YEAR;
};