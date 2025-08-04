/**
 * @dev Market price types for calculating price with skew impact
 */

// Input for market price calculation
export type MarketPriceInput = {
  collateralIndex: number;
  pairIndex: number;
  oraclePrice: number; // Current oracle price
  long: boolean; // Trade direction
  open: boolean; // Open or close
  positionSizeCollateral: number; // Trade size in collateral
};

// Result of market price calculation
export type MarketPriceResult = {
  marketPrice: number; // Oracle price adjusted by skew impact
  skewImpactP: number; // Skew impact percentage (positive or negative)
  oraclePrice: number; // Original oracle price
};

// Context for market price calculations (scoped to a single pair)
export type MarketPriceContext = {
  skewDepth: number; // Depth in tokens for the specific pair
  pairOiToken: {
    oiLongToken: number;
    oiShortToken: number;
  };
};
