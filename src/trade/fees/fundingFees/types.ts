/**
 * @dev Funding fees types for v10+ trades
 * @dev All values are normalized floats (not BigNumbers)
 */

// Funding fee parameters (per collateral/pair)
export type FundingFeeParams = {
  // Funding rate calculation parameters
  skewCoefficientPerYear: number; // Coefficient for skew-based velocity calculation
  absoluteVelocityPerYearCap: number; // Max yearly velocity (absolute value)
  absoluteRatePerSecondCap: number; // Max funding rate per second (absolute value)
  thetaThresholdUsd: number; // Min exposure USD to start charging funding fees

  // Feature flags
  fundingFeesEnabled: boolean; // Whether funding fees are enabled for this pair
  aprMultiplierEnabled: boolean; // Whether APR multiplier is enabled (smaller side earns more)
};

// Dynamic funding fee data (per collateral/pair)
export type PairFundingFeeData = {
  accFundingFeeLongP: number; // Accumulated funding fee for longs (normalized %)
  accFundingFeeShortP: number; // Accumulated funding fee for shorts (normalized %)
  lastFundingRatePerSecondP: number; // Last recorded funding rate per second (normalized %)
  lastFundingUpdateTs: number; // Timestamp of last funding fee update
};

// Global pair parameters
export type PairGlobalParams = {
  maxSkewCollateral: number; // Max allowed skew in collateral tokens
};

// Trade initial funding fees (per trade)
export type TradeInitialAccFundingFees = {
  initialAccFundingFeeP: number; // Initial accumulated funding fee when trade opened (normalized %)
};

// OI (Open Interest) information for funding calculations
export type PairOiAfterV10 = {
  oiLongToken: number; // Long OI in tokens (v10+)
  oiShortToken: number; // Short OI in tokens (v10+)
};

// Funding rate calculation values (intermediate values)
export type FundingRateCalculation = {
  pairOiToken: PairOiAfterV10;
  netExposureToken: number; // Net exposure (long - short) in tokens
  netExposureUsd: number; // Net exposure in USD
  currentVelocityPerYear: number; // Current funding velocity per year
  avgFundingRatePerSecondP: number; // Average funding rate since last update
  currentFundingRatePerSecondP: number; // Current funding rate per second
  secondsSinceLastUpdate: number; // Time elapsed since last update
  longAprMultiplier: number; // APR multiplier for longs
  shortAprMultiplier: number; // APR multiplier for shorts
};

// Context for funding fee calculations
export type GetFundingFeeContext = {
  currentTimestamp: number;
  fundingParams: {
    [collateralIndex: number]: {
      [pairIndex: number]: FundingFeeParams;
    };
  };
  fundingData: {
    [collateralIndex: number]: {
      [pairIndex: number]: PairFundingFeeData;
    };
  };
  globalParams?: {
    [collateralIndex: number]: {
      [pairIndex: number]: PairGlobalParams;
    };
  };
};

// Result of funding fee calculation for a trade
export type TradeFundingFeeResult = {
  fundingFeeCollateral: number; // Funding fee in collateral tokens
  fundingFeeP: number; // Funding fee as percentage
  currentAccFundingFeeP: number; // Current accumulated funding fee
  initialAccFundingFeeP: number; // Initial accumulated funding fee
};

// Result of pair pending accumulated fees calculation
export type PairPendingAccFundingFeesResult = {
  accFundingFeeLongP: number; // Pending accumulated funding fee for longs
  accFundingFeeShortP: number; // Pending accumulated funding fee for shorts
  currentFundingRatePerSecondP: number; // Current funding rate per second
};
