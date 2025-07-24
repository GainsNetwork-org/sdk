/**
 * @dev Trade-specific utility functions
 * @dev Common calculations and conversions used across trading modules
 */

/**
 * @dev Converts position size from collateral to tokens
 * @param positionSizeCollateral Position size in collateral tokens
 * @param currentPrice Current pair price
 * @returns Position size in tokens
 */
export const calculatePositionSizeToken = (
  positionSizeCollateral: number,
  currentPrice: number
): number => {
  if (currentPrice === 0) {
    throw new Error("Current price cannot be zero");
  }
  return positionSizeCollateral / currentPrice;
};

/**
 * @dev Converts position size from tokens to collateral
 * @param positionSizeToken Position size in tokens
 * @param currentPrice Current pair price
 * @returns Position size in collateral tokens
 */
export const calculatePositionSizeCollateral = (
  positionSizeToken: number,
  currentPrice: number
): number => {
  return positionSizeToken * currentPrice;
};
