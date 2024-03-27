import { FeeTier, TraderDailyInfo, TraderInfo } from "./types";

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

export const computeFeeMulitplier = (
  traderInfo: TraderInfo,
  traderDailyInfo: Record<number, TraderDailyInfo>,
  feeTiers: FeeTier[]
): number => {
  const currentDay = getCurrentDay();
  if (currentDay > traderInfo.lastDayUpdated) {
    let curTrailingPoints = 0;

    const earliestActiveDay = currentDay - TRAILING_PERIOD_DAYS;

    if (traderInfo.lastDayUpdated >= earliestActiveDay) {
      curTrailingPoints =
        traderInfo.trailingPoints +
        traderDailyInfo[traderInfo.lastDayUpdated].points;

      const earliestOutdatedDay =
        traderInfo.lastDayUpdated - TRAILING_PERIOD_DAYS;
      const lastOutdatedDay = earliestActiveDay - 1;

      let expiredTrailingPoints = 0;
      for (let i = earliestOutdatedDay; i <= lastOutdatedDay; ++i) {
        expiredTrailingPoints += traderDailyInfo[i].points;
      }

      curTrailingPoints -= expiredTrailingPoints;
    }

    let newFeeMultiplier = FEE_MULTIPLIER_SCALE;
    for (let i = getFeeTiersCount(feeTiers); i > 0; --i) {
      const feeTier = feeTiers[i - 1];

      if (curTrailingPoints >= feeTier.pointsThreshold) {
        newFeeMultiplier = feeTier.feeMultiplier;
        break;
      }
    }

    return newFeeMultiplier;
  }

  return FEE_MULTIPLIER_SCALE;
};
