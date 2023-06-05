export type PairGroup = {
  groupIndex: number;
  initialAccFeeLong: number;
  initialAccFeeShort: number;
  prevGroupAccFeeLong: number;
  prevGroupAccFeeShort: number;
  pairAccFeeLong: number;
  pairAccFeeShort: number;
  block: number;
};

export type Pair = {
  groups: PairGroup[];
  feePerBlock: number;
  accFeeLong: number;
  accFeeShort: number;
  accLastUpdatedBlock: number;
  lastAccBlockWeightedMarketCap: number;
};

export type Group = {
  oiLong: number;
  oiShort: number;
  feePerBlock: number;
  accFeeLong: number;
  accFeeShort: number;
  accLastUpdatedBlock: number;
  maxOi: number;
  lastAccBlockWeightedMarketCap: number;
};

export type InitialAccFees = {
  accPairFee: number;
  accGroupFee: number;
  block: number;
};
