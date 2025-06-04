import { FeeTiers, TraderFeeTiers } from "../../types";
import { FeeTier, TraderEnrollmentStatus } from "./types";

export * from "./types";
export * from "./converter";

export const TRAILING_PERIOD_DAYS = 30;

export const FEE_MULTIPLIER_SCALE = 1;

export const MAX_FEE_TIERS = 8;

export const getCurrentDay = (): number =>
  Math.floor(Date.now() / 1000 / 60 / 60 / 24);

export const getFeeTiersCount = (feeTiers: FeeTier[]): number => {
  for (let i = MAX_FEE_TIERS; i > 0; --i) {
    if (feeTiers[i - 1]?.feeMultiplier > 0) {
      return i;
    }
  }

  return 0;
};

export const getFeeMultiplier = (
  trailingPoints: number,
  tiers: FeeTier[]
): number => {
  let feeMultiplier = FEE_MULTIPLIER_SCALE;
  for (let i = getFeeTiersCount(tiers); i > 0; --i) {
    const feeTier = tiers[i - 1];

    if (trailingPoints >= feeTier.pointsThreshold) {
      feeMultiplier = feeTier.feeMultiplier;
      break;
    }
  }

  return feeMultiplier;
};

export const computeFeeMultiplier = (
  feeTiers: FeeTiers,
  traderFeeTiers: TraderFeeTiers
): { feeMultiplier: number; trailingPoints: number } => {
  const { currentDay, tiers } = feeTiers;
  const { traderInfo, expiredPoints, lastDayUpdatedPoints, traderEnrollment } =
    traderFeeTiers;
  const { lastDayUpdated, trailingPoints } = traderInfo;

  let curTrailingPoints = trailingPoints;
  if (currentDay > lastDayUpdated) {
    curTrailingPoints = 0;

    const earliestActiveDay = currentDay - TRAILING_PERIOD_DAYS;

    if (lastDayUpdated >= earliestActiveDay) {
      curTrailingPoints = trailingPoints + lastDayUpdatedPoints;

      const expiredTrailingPoints = expiredPoints.reduce(
        (acc, points) => acc + points,
        0
      );

      curTrailingPoints -= expiredTrailingPoints;
    }
  }

  const feeMultiplier =
    traderEnrollment.status === TraderEnrollmentStatus.EXCLUDED
      ? FEE_MULTIPLIER_SCALE
      : getFeeMultiplier(curTrailingPoints, tiers);

  return {
    feeMultiplier,
    trailingPoints: curTrailingPoints,
  };
};

/**
 * @dev Calculates the final fee amount after applying the trader's fee tier discount
 * @dev Mirrors the contract's calculateFeeAmount function
 * @param trader The address of the trader (not used in SDK, for consistency)
 * @param normalFeeAmountCollateral The base fee amount before any discounts
 * @param feeMultiplier The trader's fee multiplier (e.g., 0.8 = 80% of normal fee)
 * @returns The final fee amount after applying discount
 */
export const calculateFeeAmount = (
  trader: string,
  normalFeeAmountCollateral: number,
  feeMultiplier?: number
): number => {
  // If no fee multiplier provided or it's 0, return normal fee
  if (!feeMultiplier || feeMultiplier === 0) {
    return normalFeeAmountCollateral;
  }

  // Apply fee multiplier discount
  return (feeMultiplier * normalFeeAmountCollateral) / FEE_MULTIPLIER_SCALE;
};

/**
 * @dev Helper function to get trader's fee multiplier from fee tiers data
 * @param feeTiers System fee tiers configuration
 * @param traderFeeTiers Trader's fee tier data
 * @returns Fee multiplier (1e3 precision)
 */
export const getTraderFeeMultiplier = (
  feeTiers: FeeTiers,
  traderFeeTiers: TraderFeeTiers
): number => {
  const { feeMultiplier } = computeFeeMultiplier(feeTiers, traderFeeTiers);
  return feeMultiplier;
};
