import * as BorrowingFeeV2 from "./types";

/**
 * @dev Maximum borrowing rate per second (1,000% APR)
 */
export const MAX_BORROWING_RATE_PER_SECOND = 0.0317097; // 317097 / 1e10

/**
 * @dev Precision constants for borrowing v2 calculations
 */
export const BORROWING_V2_PRECISION = {
  RATE_PER_SECOND: 1e10,
  ACC_FEE: 1e20,
  PERCENTAGE: 100,
} as const;

/**
 * @dev Calculates pending accumulated borrowing fees for a pair
 * @param params Borrowing fee parameters for the pair
 * @param data Current borrowing fee data for the pair
 * @param currentPairPrice Current price of the trading pair
 * @param currentTimestamp Current timestamp (defaults to now)
 * @returns Updated accumulated borrowing fee (1e20 precision)
 */
export const getPairPendingAccBorrowingFees = (
  params: BorrowingFeeV2.BorrowingFeeParams,
  data: BorrowingFeeV2.PairBorrowingFeeData,
  currentPairPrice: number,
  currentTimestamp?: number
): number => {
  const timestamp = currentTimestamp ?? Math.floor(Date.now() / 1000);

  // Calculate time elapsed since last update
  const timeElapsed = Math.max(0, timestamp - data.lastBorrowingUpdateTs);

  // If no time elapsed, return current accumulated fee
  if (timeElapsed === 0) {
    return data.accBorrowingFeeP;
  }

  // Calculate accumulated borrowing fee delta
  // Formula: borrowingRatePerSecondP * timeElapsed * currentPairPrice
  const accBorrowingFeeDeltaP =
    params.borrowingRatePerSecondP * timeElapsed * currentPairPrice;

  return data.accBorrowingFeeP + accBorrowingFeeDeltaP;
};

/**
 * @dev Calculates borrowing fees owed by a specific trade
 * @param input Trade borrowing fee calculation input (without pairIndex)
 * @param context Pair-specific borrowing context
 * @returns Borrowing fees in collateral tokens
 */
export const getTradeBorrowingFeesCollateral = (
  input: Omit<BorrowingFeeV2.TradeBorrowingFeeInput, "pairIndex">,
  context: BorrowingFeeV2.GetPairBorrowingFeeV2Context
): number => {
  const {
    positionSizeCollateral,
    openPrice,
    currentPairPrice,
    initialAccBorrowingFeeP,
    currentTimestamp,
  } = input;

  const { params, data } = context;

  if (!params || !data) {
    return 0;
  }

  // Calculate current accumulated borrowing fees
  const currentAccBorrowingFeeP = getPairPendingAccBorrowingFees(
    params,
    data,
    currentPairPrice,
    currentTimestamp ?? context.currentTimestamp
  );

  // Calculate borrowing fees for this trade
  // Formula: (positionSizeCollateral * (currentAccFee - initialAccFee)) / openPrice / 100
  const feeDeltaP = currentAccBorrowingFeeP - initialAccBorrowingFeeP;

  return (
    (positionSizeCollateral * feeDeltaP) /
    openPrice /
    BORROWING_V2_PRECISION.PERCENTAGE
  );
};

/**
 * @dev Utility function to get pending accumulated borrowing fees for a pair using context
 * @param input Pair borrowing fee calculation input
 * @param context Context containing borrowing parameters and data
 * @returns Updated accumulated borrowing fee (1e20 precision)
 */
export const getPairBorrowingFees = (
  input: BorrowingFeeV2.PairBorrowingFeeInput,
  context: BorrowingFeeV2.GetBorrowingFeeV2Context
): number => {
  const { pairIndex, currentPairPrice, currentTimestamp } = input;

  const params = context.borrowingParams[pairIndex];
  const data = context.borrowingData[pairIndex];

  if (!params || !data) {
    return 0;
  }

  return getPairPendingAccBorrowingFees(
    params,
    data,
    currentPairPrice,
    currentTimestamp ?? context.currentTimestamp
  );
};

/**
 * @dev Utility functions for working with borrowing v2 fees
 */
export const borrowingFeeV2Utils = {
  getPairPendingAccBorrowingFees,
  getTradeBorrowingFeesCollateral,
  getPairBorrowingFees,
};

export * as BorrowingFeeV2 from "./types";
export { GetPairBorrowingFeeV2Context } from "./types";
export * from "./converter";
export * from "./builder";
export * from "./fetcher";
