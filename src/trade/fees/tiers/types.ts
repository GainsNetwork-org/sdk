export type FeeTier = {
  feeMultiplier: number;
  pointsThreshold: number;
};

export type TraderInfo = {
  lastDayUpdated: number;
  trailingPoints: number;
};

export enum TraderEnrollmentStatus {
  ENROLLED,
  EXCLUDED,
}

export type TraderEnrollment = {
  status: TraderEnrollmentStatus;
};
