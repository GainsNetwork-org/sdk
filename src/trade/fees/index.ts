import { Fee, PairIndex } from "../types";

export const getClosingFee = (
  posDai: number,
  leverage: number,
  pairIndex: PairIndex,
  pairFee: Fee | undefined,
  collateralPriceUsd: number | undefined = 0,
  feeMultiplier: number | undefined = 1
): number => {
  if (
    posDai === undefined ||
    leverage === undefined ||
    pairIndex === undefined ||
    pairFee === undefined
  ) {
    return 0;
  }

  const { totalPositionSizeFeeP, minPositionSizeUsd } = pairFee;

  return (
    totalPositionSizeFeeP *
    feeMultiplier *
    Math.max(
      collateralPriceUsd && collateralPriceUsd > 0
        ? minPositionSizeUsd / collateralPriceUsd
        : 0,
      posDai * leverage
    )
  );
};

export * from "./borrowing";
export * from "./tiers";

// Borrowing V2 exports with explicit naming to avoid conflicts
export {
  BorrowingFeeV2,
  borrowingFeeV2Utils,
  getPairPendingAccBorrowingFees as getPairPendingAccBorrowingFeesV2,
  getTradeBorrowingFeesCollateral as getTradeBorrowingFeesCollateralV2,
  getBorrowingFee as getBorrowingFeeV2,
  getPairBorrowingFees as getPairBorrowingFeesV2,
  MAX_BORROWING_RATE_PER_SECOND as MAX_BORROWING_RATE_PER_SECOND_V2,
  BORROWING_V2_PRECISION,
} from "./borrowingV2";

export {
  convertBorrowingFeeParams as convertBorrowingFeeParamsV2,
  convertBorrowingFeeParamsArray as convertBorrowingFeeParamsArrayV2,
  convertPairBorrowingFeeData as convertPairBorrowingFeeDataV2,
  convertPairBorrowingFeeDataArray as convertPairBorrowingFeeDataArrayV2,
  convertTradeInitialAccFees as convertTradeInitialAccFeesV2,
  convertTradeInitialAccFeesArray as convertTradeInitialAccFeesArrayV2,
  createBorrowingV2Context,
  isValidBorrowingRate as isValidBorrowingRateV2,
  borrowingRateToAPR as borrowingRateToAPRV2,
  aprToBorrowingRate as aprToBorrowingRateV2,
} from "./borrowingV2/converter";

// Contract utilities re-exported for convenience
export {
  fetchBorrowingFeeParamsV2,
  fetchPairBorrowingFeeDataV2,
  fetchTradeBorrowingFeesCollateralV2,
  fetchPairPendingAccBorrowingFeesV2,
  fetchAllBorrowingV2Data,
  createBorrowingV2ContextFromContract,
  createBorrowingV2ContextFromArrays,
  fetchBorrowingV2DataForPairs,
} from "../../contracts/fetch/fees/borrowingFeesV2";

// Funding Fees exports
export {
  FundingFees,
  getCurrentFundingVelocityPerYear,
  getSecondsToReachZeroRate,
  getAvgFundingRatePerSecondP,
  getLongShortAprMultiplier,
  getPairPendingAccFundingFees,
  getTradeFundingFeesCollateral,
  getTradeFundingFees,
} from "./fundingFees";

export {
  convertFundingFeeParams,
  convertFundingFeeParamsArray,
  convertPairFundingFeeData,
  convertPairFundingFeeDataArray,
  convertPairGlobalParams,
  convertPairGlobalParamsArray,
  convertTradeInitialAccFundingFees,
  createFundingFeeContext,
  isValidFundingRate,
  fundingRateToAPR,
  aprToFundingRate,
  calculateVelocityFromSkew,
  FUNDING_FEES_PRECISION,
} from "./fundingFees/converter";
