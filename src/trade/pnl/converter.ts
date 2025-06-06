/**
 * @dev Converters for PnL data between contract and SDK formats
 */

/**
 * @dev Convert PnL percentage from contract precision to SDK format
 * @param pnlPercentContract PnL percentage with 1e10 precision
 * @returns PnL percentage as regular number (e.g., 10 = 10%)
 */
export const convertPnlPercent = (
  pnlPercentContract: bigint | number
): number => {
  const value =
    typeof pnlPercentContract === "bigint"
      ? Number(pnlPercentContract)
      : pnlPercentContract;

  // Contract uses 1e10 precision for percentages
  return value / 1e10;
};

/**
 * @dev Convert PnL percentage from SDK format to contract precision
 * @param pnlPercent PnL percentage as regular number
 * @returns PnL percentage with 1e10 precision
 */
export const encodePnlPercent = (pnlPercent: number): bigint => {
  return BigInt(Math.round(pnlPercent * 1e10));
};

/**
 * @dev Convert collateral amount considering precision
 * @param amount Amount in contract format
 * @param collateralDecimals Collateral token decimals (6 or 18)
 * @returns Amount as SDK float
 */
export const convertCollateralAmount = (
  amount: bigint | number,
  collateralDecimals: number
): number => {
  const value = typeof amount === "bigint" ? Number(amount) : amount;
  return value / 10 ** collateralDecimals;
};

/**
 * @dev Convert price from contract format to SDK format
 * @param price Price with 1e10 precision
 * @returns Price as SDK float
 */
export const convertPrice = (price: bigint | number): number => {
  const value = typeof price === "bigint" ? Number(price) : price;
  return value / 1e10;
};

/**
 * @dev Convert leverage from contract format to SDK format
 * @param leverage Leverage with 1e3 precision
 * @returns Leverage as SDK float (e.g., 10 = 10x)
 */
export const convertLeverage = (leverage: bigint | number): number => {
  const value = typeof leverage === "bigint" ? Number(leverage) : leverage;
  return value / 1e3;
};

/**
 * @dev Batch convert PnL results from contract format
 * @param results Array of PnL results from contract
 * @param collateralDecimals Collateral token decimals
 * @returns Array of converted PnL results
 */
export const convertPnlResults = (
  results: Array<{
    pnlCollateral: bigint;
    pnlPercent: bigint;
  }>,
  collateralDecimals: number
): Array<{
  pnlCollateral: number;
  pnlPercent: number;
}> => {
  return results.map(result => ({
    pnlCollateral: convertCollateralAmount(
      result.pnlCollateral,
      collateralDecimals
    ),
    pnlPercent: convertPnlPercent(result.pnlPercent),
  }));
};
