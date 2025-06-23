/**
 * @dev Skew price impact types for v10+ trades
 */

// Post-v10 OI tracking for skew calculations
export type PairOiToken = {
  oiLongToken: number; // Long OI in tokens
  oiShortToken: number; // Short OI in tokens
};

export type PairOiCollateral = {
  oiLongCollateral: number; // Long OI in collateral
  oiShortCollateral: number; // Short OI in collateral
};

// Skew price impact calculation input
export type SkewPriceImpactInput = {
  collateralIndex: number;
  pairIndex: number;
  long: boolean;
  open: boolean;
  positionSizeToken: number; // Trade size in tokens
};

// Skew price impact calculation result
export type SkewPriceImpactResult = {
  priceImpactP: number; // Price impact percentage (positive or negative)
  netSkewToken: number; // Current net skew in tokens (signed)
  netSkewCollateral: number; // Current net skew in collateral (signed)
  tradeDirection: "increase" | "decrease" | "neutral"; // Impact on skew
};

// Context for skew calculations
export type SkewPriceImpactContext = {
  skewDepth: number; // Normalized depth in tokens
  pairOiToken: PairOiToken;
};

// Trade-specific parameters for skew impact
export type TradeSkewParams = {
  collateralIndex: number;
  pairIndex: number;
  long: boolean;
  open: boolean;
  positionSizeCollateral: number;
  currentPrice: number;
  contractsVersion: number;
  isCounterTrade?: boolean;
};

// Result of position size calculation
export type PositionSizeResult = {
  positionSizeToken: number;
  positionSizeCollateral: number;
};
