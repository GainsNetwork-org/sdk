import * as BorrowingFeeV2 from "./types";

/**
 * @dev Maximum borrowing rate per second (1,000% APR)
 */
export const MAX_BORROWING_RATE_PER_SECOND = 317097; // 1e10 precision

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
  // This gives us the delta in normalized float precision
  const accBorrowingFeeDeltaP =
    params.borrowingRatePerSecondP * timeElapsed * currentPairPrice;

  return data.accBorrowingFeeP + accBorrowingFeeDeltaP;
};

/**
 * @dev Calculates borrowing fees owed by a specific trade
 * @param input Trade borrowing fee calculation input
 * @param context Context containing borrowing parameters and data
 * @returns Borrowing fees in collateral tokens
 */
export const getTradeBorrowingFeesCollateral = (
  input: BorrowingFeeV2.TradeBorrowingFeeInput,
  context: BorrowingFeeV2.GetBorrowingFeeV2Context
): number => {
  const {
    positionSizeCollateral,
    openPrice,
    collateralIndex,
    pairIndex,
    currentPairPrice,
    initialAccBorrowingFeeP,
    currentTimestamp,
  } = input;

  // Get borrowing parameters and data for the pair
  const params = context.borrowingParams[collateralIndex]?.[pairIndex];
  const data = context.borrowingData[collateralIndex]?.[pairIndex];

  if (!params || !data) {
    return 0;
  }

  // Calculate current accumulated borrowing fees
  const currentAccBorrowingFeeP = getPairPendingAccBorrowingFees(
    params,
    data,
    currentPairPrice,
    currentTimestamp
  );

  // Calculate borrowing fees for this trade
  // Formula: (positionSizeCollateral * (currentAccFee - initialAccFee)) / openPrice / 100
  // Note: No precision division needed since we work with normalized floats
  const feeDeltaP = currentAccBorrowingFeeP - initialAccBorrowingFeeP;

  return (
    (positionSizeCollateral * feeDeltaP) /
    openPrice /
    BORROWING_V2_PRECISION.PERCENTAGE
  );
};

/**
 * @dev Convenience function to calculate borrowing fees for a trade using individual parameters
 * @param positionSizeCollateral Position size in collateral tokens
 * @param pairIndex Index of the trading pair
 * @param collateralIndex Index of the collateral
 * @param openPrice Price at which the trade was opened
 * @param currentPairPrice Current price of the trading pair
 * @param initialAccBorrowingFeeP Initial accumulated borrowing fee when trade was opened
 * @param context Context containing borrowing parameters and data
 * @returns Borrowing fees in collateral tokens
 */
export const getBorrowingFee = (
  positionSizeCollateral: number,
  pairIndex: number,
  collateralIndex: number,
  openPrice: number,
  currentPairPrice: number,
  initialAccBorrowingFeeP: number,
  context: BorrowingFeeV2.GetBorrowingFeeV2Context
): number => {
  return getTradeBorrowingFeesCollateral(
    {
      positionSizeCollateral,
      openPrice,
      collateralIndex,
      pairIndex,
      currentPairPrice,
      initialAccBorrowingFeeP,
      currentTimestamp: context.currentTimestamp,
    },
    context
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
  const { collateralIndex, pairIndex, currentPairPrice, currentTimestamp } =
    input;

  const params = context.borrowingParams[collateralIndex]?.[pairIndex];
  const data = context.borrowingData[collateralIndex]?.[pairIndex];

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
  getBorrowingFee,
};

export * as BorrowingFeeV2 from "./types";
export * from "./converter";
