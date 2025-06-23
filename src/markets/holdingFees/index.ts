/**
 * @dev Holding fees calculation utilities for v10+ markets
 * @dev Combines funding fees and borrowing v2 fees
 */

import {
  FundingFeeParams,
  PairFundingFeeData,
  PairOiAfterV10,
} from "../../trade/fees/fundingFees/types";
import {
  BorrowingFeeParams,
  PairBorrowingFeeData,
} from "../../trade/fees/borrowingV2/types";
import {
  getPairPendingAccFundingFees,
  getLongShortAprMultiplier,
} from "../../trade/fees/fundingFees";

const SECONDS_PER_HOUR = 3600;
const SECONDS_PER_YEAR = 365 * 24 * 60 * 60;
const PERCENTAGE_PRECISION = 100;

export type HoldingFeeRates = {
  // Total holding fees (funding + borrowing v2)
  longHourlyRate: number; // Percentage per hour (can be negative if earning)
  shortHourlyRate: number; // Percentage per hour (can be negative if earning)

  // Breakdown for tooltip
  fundingFeeLongHourlyRate: number; // Percentage per hour
  fundingFeeShortHourlyRate: number; // Percentage per hour
  borrowingFeeHourlyRate: number; // Percentage per hour (always positive)

  // Additional info
  currentFundingRatePerSecondP: number;
  currentBorrowingRatePerSecondP: number;
};

export type GetPairHoldingFeeRatesInput = {
  // Funding fee data
  fundingParams: FundingFeeParams;
  fundingData: PairFundingFeeData;
  pairOiToken: PairOiAfterV10;
  netExposureToken: number;
  netExposureUsd: number;

  // Borrowing v2 data
  borrowingParams: BorrowingFeeParams | null;
  borrowingData: PairBorrowingFeeData | null;

  // Common
  currentPairPrice: number;
  currentTimestamp: number;
};

/**
 * @dev Calculates current holding fee rates per hour for display
 * @param input Input parameters for calculation
 * @returns Holding fee rates per hour with breakdown
 */
export const getPairHoldingFeeRates = (
  input: GetPairHoldingFeeRatesInput
): HoldingFeeRates => {
  const {
    fundingParams,
    fundingData,
    pairOiToken,
    netExposureToken,
    netExposureUsd,
    borrowingParams,
    borrowingData,
    currentPairPrice,
    currentTimestamp,
  } = input;

  // Calculate funding fee rates
  let fundingFeeLongHourlyRate = 0;
  let fundingFeeShortHourlyRate = 0;
  let currentFundingRatePerSecondP = 0;

  if (fundingParams.fundingFeesEnabled) {
    // Get current funding rate
    const pendingFunding = getPairPendingAccFundingFees(
      fundingParams,
      fundingData,
      currentPairPrice,
      pairOiToken,
      netExposureToken,
      netExposureUsd,
      currentTimestamp
    );

    currentFundingRatePerSecondP = pendingFunding.currentFundingRatePerSecondP;

    // Get APR multipliers
    const { longAprMultiplier, shortAprMultiplier } = getLongShortAprMultiplier(
      currentFundingRatePerSecondP,
      pairOiToken.oiLongToken,
      pairOiToken.oiShortToken,
      fundingParams.aprMultiplierEnabled
    );

    // Calculate hourly rates
    // Funding rate * seconds per hour * current price * APR multiplier / 100
    const baseHourlyRate =
      (currentFundingRatePerSecondP * SECONDS_PER_HOUR * currentPairPrice) /
      PERCENTAGE_PRECISION;

    // Long side pays when rate is positive, earns when negative
    fundingFeeLongHourlyRate = baseHourlyRate * longAprMultiplier;
    // Short side is opposite
    fundingFeeShortHourlyRate = -baseHourlyRate * shortAprMultiplier;
  }

  // Calculate borrowing v2 rates
  let borrowingFeeHourlyRate = 0;
  let currentBorrowingRatePerSecondP = 0;

  if (borrowingParams && borrowingData) {
    currentBorrowingRatePerSecondP = borrowingParams.borrowingRatePerSecondP;

    // Borrowing rate * seconds per hour * current price / 100
    borrowingFeeHourlyRate =
      (currentBorrowingRatePerSecondP * SECONDS_PER_HOUR * currentPairPrice) /
      PERCENTAGE_PRECISION;
  }

  // Total holding fees (funding can be negative/positive, borrowing always positive cost)
  const longHourlyRate = fundingFeeLongHourlyRate + borrowingFeeHourlyRate;
  const shortHourlyRate = fundingFeeShortHourlyRate + borrowingFeeHourlyRate;

  return {
    longHourlyRate,
    shortHourlyRate,
    fundingFeeLongHourlyRate,
    fundingFeeShortHourlyRate,
    borrowingFeeHourlyRate,
    currentFundingRatePerSecondP,
    currentBorrowingRatePerSecondP,
  };
};

/**
 * @dev Converts a per-second rate to annual percentage rate (APR)
 * @param ratePerSecond Rate per second
 * @returns Annual percentage rate
 */
export const convertRatePerSecondToAPR = (ratePerSecond: number): number => {
  return ratePerSecond * SECONDS_PER_YEAR * PERCENTAGE_PRECISION;
};

/**
 * @dev Formats a holding fee rate for display
 * @param rate Hourly rate (can be negative)
 * @param decimals Number of decimal places
 * @returns Formatted string with sign
 */
export const formatHoldingFeeRate = (rate: number, decimals = 4): string => {
  const sign = rate > 0 ? "+" : "";
  return `${sign}${rate.toFixed(decimals)}%`;
};

export * as HoldingFees from "./types";
