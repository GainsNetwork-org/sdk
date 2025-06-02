/**
 * @dev Converters for funding fees data between contract and SDK formats
 * @dev All BigNumber values are normalized to floats with appropriate precision
 */

import { IFundingFees } from "../../../contracts/types/generated/GNSMultiCollatDiamond";
import {
  FundingFeeParams,
  PairFundingFeeData,
  PairGlobalParams,
  TradeInitialAccFundingFees,
  GetFundingFeeContext,
} from "./types";

// Precision constants from contract
export const FUNDING_FEES_PRECISION = {
  SKEW_COEFFICIENT_PER_YEAR: 1e26, // Skew coefficient precision
  ABSOLUTE_VELOCITY_PER_YEAR_CAP: 1e7, // Velocity cap precision
  ABSOLUTE_RATE_PER_SECOND_CAP: 1e10, // Rate cap precision
  ACC_FUNDING_FEE_P: 1e20, // Accumulated funding fee precision
  FUNDING_RATE_PER_SECOND_P: 1e18, // Funding rate per second precision
};

/**
 * @dev Converts contract funding fee params to SDK format
 * @param contractParams Contract funding fee params struct
 * @returns Normalized funding fee params
 */
export const convertFundingFeeParams = (
  contractParams: IFundingFees.FundingFeeParamsStruct
): FundingFeeParams => {
  return {
    skewCoefficientPerYear:
      Number(contractParams.skewCoefficientPerYear) /
      FUNDING_FEES_PRECISION.SKEW_COEFFICIENT_PER_YEAR,
    absoluteVelocityPerYearCap:
      Number(contractParams.absoluteVelocityPerYearCap) /
      FUNDING_FEES_PRECISION.ABSOLUTE_VELOCITY_PER_YEAR_CAP,
    absoluteRatePerSecondCap:
      Number(contractParams.absoluteRatePerSecondCap) /
      FUNDING_FEES_PRECISION.ABSOLUTE_RATE_PER_SECOND_CAP,
    thetaThresholdUsd: Number(contractParams.thetaThresholdUsd),
    fundingFeesEnabled: Boolean(contractParams.fundingFeesEnabled),
    aprMultiplierEnabled: Boolean(contractParams.aprMultiplierEnabled),
  };
};

/**
 * @dev Converts array of contract funding fee params to SDK format
 * @param contractParamsArray Array of contract funding fee params
 * @returns Array of normalized funding fee params
 */
export const convertFundingFeeParamsArray = (
  contractParamsArray: IFundingFees.FundingFeeParamsStruct[]
): FundingFeeParams[] => {
  return contractParamsArray.map(convertFundingFeeParams);
};

/**
 * @dev Converts contract pair funding fee data to SDK format
 * @param contractData Contract pair funding fee data struct
 * @returns Normalized pair funding fee data
 */
export const convertPairFundingFeeData = (
  contractData: IFundingFees.PairFundingFeeDataStruct
): PairFundingFeeData => {
  return {
    accFundingFeeLongP:
      Number(contractData.accFundingFeeLongP) /
      FUNDING_FEES_PRECISION.ACC_FUNDING_FEE_P,
    accFundingFeeShortP:
      Number(contractData.accFundingFeeShortP) /
      FUNDING_FEES_PRECISION.ACC_FUNDING_FEE_P,
    lastFundingRatePerSecondP:
      Number(contractData.lastFundingRatePerSecondP) /
      FUNDING_FEES_PRECISION.FUNDING_RATE_PER_SECOND_P,
    lastFundingUpdateTs: Number(contractData.lastFundingUpdateTs),
  };
};

/**
 * @dev Converts array of contract pair funding fee data to SDK format
 * @param contractDataArray Array of contract pair funding fee data
 * @returns Array of normalized pair funding fee data
 */
export const convertPairFundingFeeDataArray = (
  contractDataArray: IFundingFees.PairFundingFeeDataStruct[]
): PairFundingFeeData[] => {
  return contractDataArray.map(convertPairFundingFeeData);
};

/**
 * @dev Converts contract pair global params to SDK format
 * @param contractParams Contract pair global params struct
 * @returns Normalized pair global params
 */
export const convertPairGlobalParams = (
  contractParams: IFundingFees.PairGlobalParamsStruct
): PairGlobalParams => {
  return {
    maxSkewCollateral: Number(contractParams.maxSkewCollateral),
  };
};

/**
 * @dev Converts array of contract pair global params to SDK format
 * @param contractParamsArray Array of contract pair global params
 * @returns Array of normalized pair global params
 */
export const convertPairGlobalParamsArray = (
  contractParamsArray: IFundingFees.PairGlobalParamsStruct[]
): PairGlobalParams[] => {
  return contractParamsArray.map(convertPairGlobalParams);
};

/**
 * @dev Converts contract trade initial acc funding fees to SDK format
 * @param contractFees Contract trade fees data (only funding fee part)
 * @returns Normalized trade initial acc funding fees
 */
export const convertTradeInitialAccFundingFees = (contractFees: {
  initialAccFundingFeeP: bigint | number | string;
}): TradeInitialAccFundingFees => {
  return {
    initialAccFundingFeeP:
      Number(contractFees.initialAccFundingFeeP) /
      FUNDING_FEES_PRECISION.ACC_FUNDING_FEE_P,
  };
};

/**
 * @dev Creates a funding fee context from arrays of data
 * @param collateralIndices Array of collateral indices
 * @param pairIndices Array of pair indices
 * @param params Array of funding fee parameters
 * @param data Array of pair funding fee data
 * @param globalParams Optional array of global parameters
 * @param currentTimestamp Optional current timestamp
 * @returns Complete funding fee context
 */
export const createFundingFeeContext = (
  collateralIndices: number[],
  pairIndices: number[],
  params: FundingFeeParams[],
  data: PairFundingFeeData[],
  globalParams?: PairGlobalParams[],
  currentTimestamp?: number
): GetFundingFeeContext => {
  const context: GetFundingFeeContext = {
    currentTimestamp: currentTimestamp ?? Math.floor(Date.now() / 1000),
    fundingParams: {},
    fundingData: {},
    globalParams: globalParams ? {} : undefined,
  };

  // Build nested objects indexed by collateralIndex and pairIndex
  for (let i = 0; i < collateralIndices.length; i++) {
    const collateralIndex = collateralIndices[i];
    const pairIndex = pairIndices[i];

    // Initialize collateral index objects if they don't exist
    if (!context.fundingParams[collateralIndex]) {
      context.fundingParams[collateralIndex] = {};
    }
    if (!context.fundingData[collateralIndex]) {
      context.fundingData[collateralIndex] = {};
    }
    if (globalParams && context.globalParams) {
      if (!context.globalParams[collateralIndex]) {
        context.globalParams[collateralIndex] = {};
      }
    }

    // Store data
    context.fundingParams[collateralIndex][pairIndex] = params[i];
    context.fundingData[collateralIndex][pairIndex] = data[i];
    if (globalParams && context.globalParams) {
      context.globalParams[collateralIndex][pairIndex] = globalParams[i];
    }
  }

  return context;
};

/**
 * @dev Validates funding rate is within allowed bounds
 * @param absoluteRatePerSecondCap Rate cap (normalized)
 * @returns Whether the rate is valid
 */
export const isValidFundingRate = (
  absoluteRatePerSecondCap: number
): boolean => {
  // Convert back to contract precision for validation
  const contractValue =
    absoluteRatePerSecondCap *
    FUNDING_FEES_PRECISION.ABSOLUTE_RATE_PER_SECOND_CAP;
  return contractValue <= 3170979; // MAX_FUNDING_RATE_PER_SECOND from contract
};

/**
 * @dev Converts funding rate per second to APR
 * @param ratePerSecondP Funding rate per second (normalized)
 * @returns APR as percentage
 */
export const fundingRateToAPR = (ratePerSecondP: number): number => {
  return ratePerSecondP * 365 * 24 * 60 * 60 * 100;
};

/**
 * @dev Converts APR to funding rate per second
 * @param apr APR as percentage
 * @returns Funding rate per second (normalized)
 */
export const aprToFundingRate = (apr: number): number => {
  return apr / (365 * 24 * 60 * 60 * 100);
};

/**
 * @dev Calculates velocity per year from skew coefficient
 * @param skewRatio Current skew ratio (net exposure / total OI)
 * @param skewCoefficientPerYear Skew coefficient per year (normalized)
 * @returns Velocity per year
 */
export const calculateVelocityFromSkew = (
  skewRatio: number,
  skewCoefficientPerYear: number
): number => {
  return Math.abs(skewRatio) * skewCoefficientPerYear;
};
