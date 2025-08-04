/**
 * @dev Pair-specific funding fee types and utilities
 */

import {
  FundingFeeParams,
  PairFundingFeeData,
  PairGlobalParams,
  PairOiAfterV10,
  PairPendingAccFundingFeesResult,
} from "./types";
import { getPairPendingAccFundingFees as getPairPendingAccFundingFeesMain } from "./index";

/**
 * @dev Context for pair-specific funding fee calculations
 */
export type GetPairFundingFeeContext = {
  currentTimestamp: number;
  params: FundingFeeParams;
  data: PairFundingFeeData;
  globalParams?: PairGlobalParams;
  pairOi?: PairOiAfterV10;
  netExposureToken?: number;
  netExposureUsd?: number;
};

/**
 * @dev Input for pair-specific trade funding fee calculation
 */
export type PairTradeFundingFeeInput = {
  positionSizeCollateral: number;
  openPrice: number;
  long: boolean;
  currentPairPrice: number;
  initialAccFundingFeeP: number;
};

/**
 * @dev Calculate pending accumulated funding fees for a pair using pair-specific context
 * @param currentPairPrice Current price of the pair
 * @param context Pair-specific funding context
 * @returns Pending accumulated funding fees
 */
export const getPairPendingAccFundingFees = (
  currentPairPrice: number,
  context: GetPairFundingFeeContext
): PairPendingAccFundingFeesResult => {
  return getPairPendingAccFundingFeesMain(
    context.params,
    context.data,
    currentPairPrice,
    context.pairOi || { oiLongToken: 0, oiShortToken: 0 },
    context.netExposureToken || 0,
    context.netExposureUsd || 0,
    context.currentTimestamp
  );
};
