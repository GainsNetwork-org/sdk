/**
 * @dev Types for borrowing v2 fees system (simplified rate-based model)
 */

/**
 * @dev Borrowing fee parameters for a specific pair/collateral combination
 */
export type BorrowingFeeParams = {
  /**
   * @dev Borrowing rate % per second
   * @dev Raw contract value divided by 1e10
   * @dev Max: ~0.0000317097 => 1,000% APR
   */
  borrowingRatePerSecondP: number;
};

/**
 * @dev Accumulated borrowing fee data for a specific pair/collateral combination
 */
export type PairBorrowingFeeData = {
  /**
   * @dev Accumulated borrowing fees % weighted by pair price
   * @dev Unit: fee collateral per 100 units of OI in pair amount
   */
  accBorrowingFeeP: number;
  /**
   * @dev Timestamp of last accumulated borrowing fees update
   */
  lastBorrowingUpdateTs: number;
};

/**
 * @dev Trade-specific borrowing fee data stored when position is opened
 */
export type TradeInitialAccFees = {
  /**
   * @dev Initial accumulated borrowing fee when trade was opened (normalized float)
   * @dev Raw contract value divided by 1e20
   * @dev Used to calculate how much borrowing fees the trade owes
   */
  initialAccBorrowingFeeP: number;
};

/**
 * @dev Context required for borrowing v2 fee calculations
 * @dev Context is already scoped to a specific collateral
 */
export type GetBorrowingFeeV2Context = {
  /**
   * @dev Current timestamp (defaults to Date.now() / 1000)
   */
  currentTimestamp?: number;
  /**
   * @dev Borrowing fee parameters for pairs
   * @dev Indexed by: params[pairIndex]
   */
  borrowingParams: Record<number, BorrowingFeeParams>;
  /**
   * @dev Borrowing fee data for pairs
   * @dev Indexed by: data[pairIndex]
   */
  borrowingData: Record<number, PairBorrowingFeeData>;
};

/**
 * @dev Context for pair-specific borrowing v2 fee calculations
 */
export type GetPairBorrowingFeeV2Context = {
  /**
   * @dev Current timestamp (defaults to Date.now() / 1000)
   */
  currentTimestamp?: number;
  /**
   * @dev Borrowing fee parameters for this specific pair
   */
  params: BorrowingFeeParams;
  /**
   * @dev Borrowing fee data for this specific pair
   */
  data: PairBorrowingFeeData;
};

/**
 * @dev Input for calculating pending borrowing fees for a pair
 */
export type PairBorrowingFeeInput = {
  pairIndex: number;
  currentPairPrice: number;
  currentTimestamp?: number;
};

/**
 * @dev Input for calculating borrowing fees for a specific trade
 */
export type TradeBorrowingFeeInput = {
  positionSizeCollateral: number;
  openPrice: number;
  pairIndex: number;
  currentPairPrice: number;
  initialAccBorrowingFeeP: number;
  currentTimestamp?: number;
};
