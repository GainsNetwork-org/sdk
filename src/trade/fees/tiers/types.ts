export type FeeTier = {
  feeMultiplier: number;
  pointsThreshold: number;
};

export type TraderInfo = {
  lastDayUpdated: number;
  trailingPoints: number;
};

export type TraderDailyInfo = {
  feeMultiplierCache: number;
  points: number;
};
