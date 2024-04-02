import { FeeTiers, TraderFeeTiers } from "../../types";
import { FeeTier } from "./types";

export const TRAILING_PERIOD_DAYS = 30;

export const FEE_MULTIPLIER_SCALE = 1;

export const MAX_FEE_TIERS = 8;

export const getCurrentDay = (): number =>
  Math.floor(Date.now() / 1000 / 60 / 60 / 24);

export const getFeeTiersCount = (feeTiers: FeeTier[]): number => {
  for (let i = MAX_FEE_TIERS; i > 0; --i) {
    if (feeTiers[i - 1].feeMultiplier > 0) {
      return i;
    }
  }

  return 0;
};

export const computeFeeMultiplier = (
  feeTiers: FeeTiers,
  traderFeeTiers: TraderFeeTiers
): { feeMultiplier: number; trailingPoints: number } => {
  const { currentDay, tiers } = feeTiers;
  const { traderInfo, expiredPoints, lastDayUpdatedPoints } = traderFeeTiers;
  const { lastDayUpdated, trailingPoints } = traderInfo;

  if (currentDay > lastDayUpdated) {
    let curTrailingPoints = 0;

    const earliestActiveDay = currentDay - TRAILING_PERIOD_DAYS;

    if (lastDayUpdated >= earliestActiveDay) {
      curTrailingPoints = trailingPoints + lastDayUpdatedPoints;

      const expiredTrailingPoints = expiredPoints.reduce(
        (acc, points) => acc + points,
        0
      );

      curTrailingPoints -= expiredTrailingPoints;
    }

    let newFeeMultiplier = FEE_MULTIPLIER_SCALE;
    for (let i = getFeeTiersCount(tiers); i > 0; --i) {
      const feeTier = tiers[i - 1];

      if (curTrailingPoints >= feeTier.pointsThreshold) {
        newFeeMultiplier = feeTier.feeMultiplier;
        break;
      }
    }

    return {
      feeMultiplier: newFeeMultiplier,
      trailingPoints: curTrailingPoints,
    };
  }

  return {
    feeMultiplier: FEE_MULTIPLIER_SCALE,
    trailingPoints,
  };
};
