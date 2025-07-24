import { Trade } from "../types";
import {
  ValidateCounterTradeContext,
  ValidateCounterTradeResult,
} from "./types";

/**
 * Validates a counter trade based on pair OI skew, matching the contract's validateCounterTrade logic
 * @param trade Trade object
 * @param positionSizeCollateral Position size in collateral tokens
 * @param context Context containing the pair OI skew
 * @returns Validation result with exceeding collateral amount if applicable
 */
export function validateCounterTrade(
  trade: Trade,
  positionSizeCollateral: number,
  context: ValidateCounterTradeContext
): ValidateCounterTradeResult {
  const { pairOiSkewCollateral } = context;

  // Calculate signed position size based on trade direction
  const positionSizeCollateralSigned =
    positionSizeCollateral * (trade.long ? 1 : -1);

  // Check if position improves skew (opposite signs)
  if (
    pairOiSkewCollateral === 0 ||
    (pairOiSkewCollateral > 0 && positionSizeCollateralSigned > 0) ||
    (pairOiSkewCollateral < 0 && positionSizeCollateralSigned < 0)
  ) {
    return { isValidated: false, exceedingPositionSizeCollateral: 0 };
  }

  // Calculate maximum position size that brings skew to 0
  const maxPositionSizeCollateral = Math.abs(pairOiSkewCollateral);

  // Calculate exceeding amount
  const exceedingPositionSizeCollateral =
    positionSizeCollateral > maxPositionSizeCollateral
      ? positionSizeCollateral - maxPositionSizeCollateral
      : 0;

  return { isValidated: true, exceedingPositionSizeCollateral };
}
