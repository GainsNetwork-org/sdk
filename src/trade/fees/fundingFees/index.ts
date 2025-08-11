/**
 * @dev Funding fees calculations for v10+ trades
 * @dev Based on skew-based funding rate model with velocity and APR multipliers
 */

import {
  FundingFeeParams,
  PairFundingFeeData,
  GetFundingFeeContext,
  TradeFundingFeeResult,
  PairPendingAccFundingFeesResult,
  PairOiAfterV10,
} from "./types";
import { GetPairFundingFeeContext } from "./pairContext";
import { ContractsVersion } from "../../../contracts/types";

// Constants from contract
const FUNDING_APR_MULTIPLIER_CAP = 100; // Smaller side can earn up to 100x more APR
const ONE_YEAR = 365 * 24 * 60 * 60; // 1 year in seconds

/**
 * @dev Calculates current funding velocity per year based on skew
 * @param netExposureToken Net exposure (long - short) in tokens
 * @param netExposureUsd Net exposure in USD
 * @param skewCoefficientPerYear Skew coefficient per year from params
 * @param absoluteVelocityPerYearCap Cap on velocity per year
 * @param thetaThresholdUsd Minimum exposure USD to start charging funding fees
 * @returns Current yearly funding velocity
 */
export const getCurrentFundingVelocityPerYear = (
  netExposureToken: number,
  netExposureUsd: number,
  skewCoefficientPerYear: number,
  absoluteVelocityPerYearCap: number,
  thetaThresholdUsd: number
): number => {
  // If no exposure or skew coefficient 0 or velocity cap 0, velocity is 0
  if (
    netExposureToken === 0 ||
    skewCoefficientPerYear === 0 ||
    absoluteVelocityPerYearCap === 0
  ) {
    return 0;
  }

  // Check theta threshold
  const absNetExposureUsd = Math.abs(netExposureUsd);
  if (absNetExposureUsd < thetaThresholdUsd) {
    return 0;
  }

  // Calculate absolute velocity
  const absoluteVelocityPerYear =
    Math.abs(netExposureToken) * skewCoefficientPerYear;

  // Apply cap
  const cappedAbsoluteVelocity = Math.min(
    absoluteVelocityPerYear,
    absoluteVelocityPerYearCap
  );

  // Return with proper sign
  return netExposureToken < 0
    ? -cappedAbsoluteVelocity
    : cappedAbsoluteVelocity;
};

/**
 * @dev Calculates seconds until funding rate reaches zero
 * @param lastFundingRatePerSecondP Last funding rate per second
 * @param currentVelocityPerYear Current velocity per year
 * @returns Seconds until rate reaches zero
 */
export const getSecondsToReachZeroRate = (
  lastFundingRatePerSecondP: number,
  currentVelocityPerYear: number
): number => {
  if (currentVelocityPerYear === 0) {
    throw new Error(
      "Velocity cannot be zero when calculating time to reach zero rate"
    );
  }

  const secondsToReachZeroRate =
    (-lastFundingRatePerSecondP * ONE_YEAR) / currentVelocityPerYear;

  if (secondsToReachZeroRate < 0) {
    throw new Error(
      "Invalid calculation: seconds to reach zero rate cannot be negative"
    );
  }

  return secondsToReachZeroRate;
};

/**
 * @dev Calculates average and current funding rate per second
 * @param lastFundingRatePerSecondP Last funding rate per second
 * @param absoluteRatePerSecondCap Absolute cap on funding rate per second
 * @param currentVelocityPerYear Current velocity per year
 * @param secondsSinceLastUpdate Seconds elapsed since last update
 * @returns Average and current funding rate per second
 */
export const getAvgFundingRatePerSecondP = (
  lastFundingRatePerSecondP: number,
  absoluteRatePerSecondCap: number,
  currentVelocityPerYear: number,
  secondsSinceLastUpdate: number
): {
  avgFundingRatePerSecondP: number;
  currentFundingRatePerSecondP: number;
} => {
  // If cap is 0, there are no funding fees
  if (absoluteRatePerSecondCap === 0) {
    return { avgFundingRatePerSecondP: 0, currentFundingRatePerSecondP: 0 };
  }

  // If velocity is 0 or no time elapsed, funding rate is still the same
  if (currentVelocityPerYear === 0 || secondsSinceLastUpdate === 0) {
    return {
      avgFundingRatePerSecondP: lastFundingRatePerSecondP,
      currentFundingRatePerSecondP: lastFundingRatePerSecondP,
    };
  }

  const ratePerSecondCap =
    absoluteRatePerSecondCap * (currentVelocityPerYear < 0 ? -1 : 1);

  // If rate is already at cap, just return it
  if (ratePerSecondCap === lastFundingRatePerSecondP) {
    return {
      avgFundingRatePerSecondP: ratePerSecondCap,
      currentFundingRatePerSecondP: ratePerSecondCap,
    };
  }

  const secondsToReachCap =
    ((ratePerSecondCap - lastFundingRatePerSecondP) * ONE_YEAR) /
    currentVelocityPerYear;

  if (secondsSinceLastUpdate > secondsToReachCap) {
    // Rate reached cap during this period
    const currentFundingRatePerSecondP = ratePerSecondCap;

    // Weighted average: time to cap at average rate + time at cap
    const avgFundingRatePerSecondP_1 =
      (lastFundingRatePerSecondP + ratePerSecondCap) / 2;
    const avgFundingRatePerSecondP =
      (avgFundingRatePerSecondP_1 * secondsToReachCap +
        ratePerSecondCap * (secondsSinceLastUpdate - secondsToReachCap)) /
      secondsSinceLastUpdate;

    return { avgFundingRatePerSecondP, currentFundingRatePerSecondP };
  } else {
    // Rate didn't reach cap
    const currentFundingRatePerSecondP =
      lastFundingRatePerSecondP +
      (secondsSinceLastUpdate * currentVelocityPerYear) / ONE_YEAR;

    const avgFundingRatePerSecondP =
      (lastFundingRatePerSecondP + currentFundingRatePerSecondP) / 2;

    return { avgFundingRatePerSecondP, currentFundingRatePerSecondP };
  }
};

/**
 * @dev Calculates APR multipliers for long and short sides based on OI ratio
 * @param avgFundingRatePerSecondP Average funding rate per second
 * @param pairOiLongToken Long OI in tokens
 * @param pairOiShortToken Short OI in tokens
 * @param aprMultiplierEnabled Whether APR multiplier is enabled
 * @returns Long and short APR multipliers
 */
export const getLongShortAprMultiplier = (
  avgFundingRatePerSecondP: number,
  pairOiLongToken: number,
  pairOiShortToken: number,
  aprMultiplierEnabled: boolean
): { longAprMultiplier: number; shortAprMultiplier: number } => {
  // If funding rate is 0, multipliers don't matter
  if (avgFundingRatePerSecondP === 0) {
    return { longAprMultiplier: 1, shortAprMultiplier: 1 };
  }

  const longsEarned = avgFundingRatePerSecondP < 0;

  let longAprMultiplier = 1;
  let shortAprMultiplier = 1;

  if (aprMultiplierEnabled) {
    if (longsEarned && pairOiLongToken > 0) {
      longAprMultiplier = pairOiShortToken / pairOiLongToken;
    } else if (!longsEarned && pairOiShortToken > 0) {
      shortAprMultiplier = pairOiLongToken / pairOiShortToken;
    }

    // Apply cap
    longAprMultiplier = Math.min(longAprMultiplier, FUNDING_APR_MULTIPLIER_CAP);
    shortAprMultiplier = Math.min(
      shortAprMultiplier,
      FUNDING_APR_MULTIPLIER_CAP
    );
  }

  return { longAprMultiplier, shortAprMultiplier };
};

/**
 * @dev Calculates pending accumulated funding fees for a pair
 * @param params Funding fee parameters
 * @param data Current funding fee data
 * @param currentPairPrice Current pair price
 * @param pairOiToken Pair OI after v10
 * @param netExposureToken Net exposure in tokens
 * @param netExposureUsd Net exposure in USD
 * @param currentTimestamp Current timestamp
 * @returns Pending accumulated funding fees and current rate
 */
export const getPairPendingAccFundingFees = (
  params: FundingFeeParams,
  data: PairFundingFeeData,
  currentPairPrice: number,
  pairOiToken: PairOiAfterV10,
  netExposureToken: number,
  netExposureUsd: number,
  currentTimestamp: number
): PairPendingAccFundingFeesResult => {
  let accFundingFeeLongP = data.accFundingFeeLongP;
  let accFundingFeeShortP = data.accFundingFeeShortP;

  // If funding fees are disabled, return current values
  if (!params.fundingFeesEnabled) {
    return {
      accFundingFeeLongP,
      accFundingFeeShortP,
      currentFundingRatePerSecondP: data.lastFundingRatePerSecondP,
    };
  }

  const secondsSinceLastUpdate = currentTimestamp - data.lastFundingUpdateTs;

  // Calculate current velocity
  const currentVelocityPerYear = getCurrentFundingVelocityPerYear(
    netExposureToken,
    netExposureUsd,
    params.skewCoefficientPerYear,
    params.absoluteVelocityPerYearCap,
    params.thetaThresholdUsd
  );

  // Get average and current funding rates
  const { avgFundingRatePerSecondP, currentFundingRatePerSecondP } =
    getAvgFundingRatePerSecondP(
      data.lastFundingRatePerSecondP,
      params.absoluteRatePerSecondCap,
      currentVelocityPerYear,
      secondsSinceLastUpdate
    );

  // Check if we need to handle rate sign change
  const rateChangedSign =
    params.aprMultiplierEnabled &&
    ((currentFundingRatePerSecondP > 0 && data.lastFundingRatePerSecondP < 0) ||
      (currentFundingRatePerSecondP < 0 && data.lastFundingRatePerSecondP > 0));

  if (rateChangedSign) {
    // Split calculation into two periods: before and after sign change

    // 1. From last update to rate = 0
    const secondsToReachZeroRate = getSecondsToReachZeroRate(
      data.lastFundingRatePerSecondP,
      currentVelocityPerYear
    );

    const avgFundingRatePerSecondP_1 = data.lastFundingRatePerSecondP / 2;
    const fundingFeesDeltaP_1 =
      avgFundingRatePerSecondP_1 * secondsToReachZeroRate * currentPairPrice;

    const {
      longAprMultiplier: longMultiplier1,
      shortAprMultiplier: shortMultiplier1,
    } = getLongShortAprMultiplier(
      avgFundingRatePerSecondP_1,
      pairOiToken.oiLongToken,
      pairOiToken.oiShortToken,
      true
    );

    accFundingFeeLongP += fundingFeesDeltaP_1 * longMultiplier1;
    accFundingFeeShortP -= fundingFeesDeltaP_1 * shortMultiplier1;

    // 2. From rate = 0 to current rate
    const avgFundingRatePerSecondP_2 = currentFundingRatePerSecondP / 2;
    const fundingFeesDeltaP_2 =
      avgFundingRatePerSecondP_2 *
      (secondsSinceLastUpdate - secondsToReachZeroRate) *
      currentPairPrice;

    const {
      longAprMultiplier: longMultiplier2,
      shortAprMultiplier: shortMultiplier2,
    } = getLongShortAprMultiplier(
      avgFundingRatePerSecondP_2,
      pairOiToken.oiLongToken,
      pairOiToken.oiShortToken,
      true
    );

    accFundingFeeLongP += fundingFeesDeltaP_2 * longMultiplier2;
    accFundingFeeShortP -= fundingFeesDeltaP_2 * shortMultiplier2;
  } else {
    // Single period calculation
    const fundingFeesDeltaP =
      avgFundingRatePerSecondP * secondsSinceLastUpdate * currentPairPrice;

    const { longAprMultiplier, shortAprMultiplier } = getLongShortAprMultiplier(
      avgFundingRatePerSecondP,
      pairOiToken.oiLongToken,
      pairOiToken.oiShortToken,
      params.aprMultiplierEnabled
    );

    accFundingFeeLongP += fundingFeesDeltaP * longAprMultiplier;
    accFundingFeeShortP -= fundingFeesDeltaP * shortAprMultiplier;
  }
  return {
    accFundingFeeLongP,
    accFundingFeeShortP,
    currentFundingRatePerSecondP,
  };
};

/**
 * @dev Calculates funding fees for a specific trade
 * @param trade Trade parameters (collateral amount, leverage, open price, long/short)
 * @param tradeInfo Trade info (contracts version)
 * @param tradeFeesData Trade fees data containing initial acc funding fee
 * @param currentPairPrice Current pair price
 * @param context Pair-specific funding fee context
 * @returns Funding fee in collateral tokens
 */
export const getTradeFundingFeesCollateral = (
  trade: {
    collateralAmount: number;
    leverage: number;
    openPrice: number;
    long: boolean;
  },
  tradeInfo: {
    contractsVersion: number;
  },
  tradeFeesData: {
    initialAccFundingFeeP: number;
  },
  currentPairPrice: number,
  context: GetPairFundingFeeContext
): number => {
  if (tradeInfo.contractsVersion < ContractsVersion.V10) {
    return 0;
  }

  context.netExposureUsd = (context.netExposureToken || 0) * currentPairPrice;
  const positionSizeCollateral = trade.collateralAmount * trade.leverage;

  if (!context.params.fundingFeesEnabled) {
    return 0;
  }

  // Calculate pending accumulated fees
  const { accFundingFeeLongP, accFundingFeeShortP } =
    getPairPendingAccFundingFees(
      context.params,
      context.data,
      currentPairPrice,
      context.pairOi || { oiLongToken: 0, oiShortToken: 0 },
      context.netExposureToken || 0,
      context.netExposureUsd || 0,
      context.currentTimestamp
    );

  const currentAccFundingFeeP = trade.long
    ? accFundingFeeLongP
    : accFundingFeeShortP;
  const fundingFeeDelta =
    currentAccFundingFeeP - tradeFeesData.initialAccFundingFeeP;

  return (positionSizeCollateral * fundingFeeDelta) / trade.openPrice / 100;
};

/**
 * @dev Main function to calculate funding fees for a trade within context
 * @param input Trade funding fee input parameters
 * @param context Funding fee context with params and data
 * @returns Complete funding fee calculation result
 */
export const getTradeFundingFees = (
  input: {
    collateralIndex: number;
    pairIndex: number;
    trade: {
      collateralAmount: number;
      leverage: number;
      openPrice: number;
      long: boolean;
    };
    tradeInfo: {
      contractsVersion: number;
    };
    initialAccFundingFeeP: number;
    currentPairPrice: number;
    pairOiToken: PairOiAfterV10;
    netExposureToken: number;
    netExposureUsd: number;
  },
  context: GetFundingFeeContext
): TradeFundingFeeResult => {
  // Get params and data from context
  const params =
    context.fundingParams[input.collateralIndex]?.[input.pairIndex];
  const data = context.fundingData[input.collateralIndex]?.[input.pairIndex];

  if (!params || !data) {
    throw new Error(
      `Missing funding fee data for collateral ${input.collateralIndex} pair ${input.pairIndex}`
    );
  }

  // Calculate pending accumulated fees
  const { accFundingFeeLongP, accFundingFeeShortP } =
    getPairPendingAccFundingFees(
      params,
      data,
      input.currentPairPrice,
      input.pairOiToken,
      input.netExposureToken,
      input.netExposureUsd,
      context.currentTimestamp
    );

  const currentAccFundingFeeP = input.trade.long
    ? accFundingFeeLongP
    : accFundingFeeShortP;

  // Calculate funding fee in collateral
  const fundingFeeCollateral = getTradeFundingFeesCollateralSimple(
    input.trade,
    input.tradeInfo,
    input.initialAccFundingFeeP,
    currentAccFundingFeeP
  );

  // Calculate funding fee as percentage
  const fundingFeeP =
    input.trade.collateralAmount > 0
      ? (fundingFeeCollateral / input.trade.collateralAmount) * 100
      : 0;

  return {
    fundingFeeCollateral,
    fundingFeeP,
    currentAccFundingFeeP,
    initialAccFundingFeeP: input.initialAccFundingFeeP,
  };
};

/**
 * @dev Simple version of getTradeFundingFeesCollateral for backward compatibility
 * @param trade Trade parameters
 * @param tradeInfo Trade info with contracts version
 * @param initialAccFundingFeeP Initial accumulated funding fee
 * @param currentAccFundingFeeP Current accumulated funding fee
 * @returns Funding fee in collateral tokens
 */
export const getTradeFundingFeesCollateralSimple = (
  trade: {
    collateralAmount: number;
    leverage: number;
    openPrice: number;
    long: boolean;
  },
  tradeInfo: {
    contractsVersion: number;
  },
  initialAccFundingFeeP: number,
  currentAccFundingFeeP: number
): number => {
  // Funding fees are only charged on post-v10 trades
  if (tradeInfo.contractsVersion < ContractsVersion.V10) {
    return 0;
  }

  const positionSizeCollateral = trade.collateralAmount * trade.leverage;
  const fundingFeeDelta = currentAccFundingFeeP - initialAccFundingFeeP;

  return (positionSizeCollateral * fundingFeeDelta) / trade.openPrice / 100;
};

// Export namespace for types
export * as FundingFees from "./types";

// Re-export specific types for convenience
export type {
  FundingFeeParams,
  PairFundingFeeData,
  PairGlobalParams,
  TradeInitialAccFundingFees,
  PairOiAfterV10,
  FundingRateCalculation,
  GetFundingFeeContext,
  TradeFundingFeeResult,
  PairPendingAccFundingFeesResult,
  PairAccumulatedFees,
  TradeInitialAccFees,
} from "./types";

// Re-export pair-specific context types
export type { GetPairFundingFeeContext } from "./pairContext";

export * from "./fetcher";
export * from "./pairContext";
export * from "./builder";
