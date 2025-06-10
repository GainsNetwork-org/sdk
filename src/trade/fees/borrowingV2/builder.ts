import { GlobalTradingVariablesType } from "../../../backend/tradingVariables/types";
import { GetPairBorrowingFeeV2Context } from "./types";

/**
 * @dev Builds borrowing v2 sub-context for a specific pair
 */
export const buildBorrowingV2Context = (
  globalTradingVariables: GlobalTradingVariablesType,
  collateralIndex: number,
  pairIndex: number,
  currentTimestamp: number
): GetPairBorrowingFeeV2Context | undefined => {
  const collateral = globalTradingVariables.collaterals[collateralIndex - 1];
  if (!collateral?.pairBorrowingFeesV2) {
    return undefined;
  }

  const params = collateral.pairBorrowingFeesV2.params?.[pairIndex];
  const data = collateral.pairBorrowingFeesV2.data?.[pairIndex];

  if (!params || !data) {
    return undefined;
  }

  return {
    params,
    data,
    currentTimestamp,
  };
};
