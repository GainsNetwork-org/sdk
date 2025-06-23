/**
 * @dev Context builder for borrowing v1 fees
 */

import { GlobalTradingVariablesType } from "../../../backend/tradingVariables/types";
import { GetBorrowingFeeContext } from "./index";

/**
 * @dev Builds borrowing v1 context from global trading variables
 * @dev Returns full array-based context required for v1 borrowing fee calculations
 * @param globalTradingVariables The transformed global trading variables from backend
 * @param collateralIndex Collateral index (1-based)
 * @param currentBlock Current block number
 * @returns Full borrowing context with all pairs and groups or undefined if data not available
 */
export const buildBorrowingV1Context = (
  globalTradingVariables: GlobalTradingVariablesType,
  collateralIndex: number,
  currentBlock: number
): GetBorrowingFeeContext | undefined => {
  const collateral = globalTradingVariables.collaterals[collateralIndex - 1];
  if (!collateral?.pairBorrowingFees || !collateral?.groupBorrowingFees) {
    return undefined;
  }

  const pairs = collateral.pairBorrowingFees;
  const groups = collateral.groupBorrowingFees;

  if (pairs.length === 0 || groups.length === 0) {
    return undefined;
  }

  return {
    currentBlock,
    pairs,
    groups,
    collateralPriceUsd: collateral.prices?.collateralPriceUsd || 1,
  };
};
