/**
 * @dev Type definitions for holding fees (funding + borrowing v2)
 */

export interface HoldingFeeRates {
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
}

export interface GetPairHoldingFeeRatesInput {
  // Funding fee data
  fundingParams: import("../../trade/fees/fundingFees/types").FundingFeeParams;
  fundingData: import("../../trade/fees/fundingFees/types").PairFundingFeeData;
  pairOiToken: import("../../trade/fees/fundingFees/types").PairOiAfterV10;
  netExposureToken: number;
  netExposureUsd: number;

  // Borrowing v2 data
  borrowingParams:
    | import("../../trade/fees/borrowingV2/types").BorrowingFeeParams
    | null;
  borrowingData:
    | import("../../trade/fees/borrowingV2/types").PairBorrowingFeeData
    | null;

  // Common
  currentPairPrice: number;
  currentTimestamp: number;
}
