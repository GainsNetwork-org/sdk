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

/**
 * @dev Types for signed prices data structure
 */

export type SignedPricesResponse = {
  signedData: SignedPrices;
  missingPrices: number[]; // pair indices that were requested but not included
};

export type SignedPrices = {
  signerId: number;
  expiryTs: number; // in seconds
  fromBlock: number;
  isLookback: boolean;
  pairIndices: number[]; // in ascending order
  prices: Price[];
  signature: string;
};

export type Price = {
  open: string; // 1e10 precision
  high: string; // 1e10 precision
  low: string; // 1e10 precision
  current: string; // 1e10 precision
  ts: number; // in seconds
};

export type Oracle = { url: string; key?: string };
