import { OpenInterest } from "../../types";

export type BorrowingData = {
  feePerBlock: number;
  accFeeLong: number;
  accFeeShort: number;
  accLastUpdatedBlock: number;
  feeExponent: number;
};

export type PairGroup = {
  groupIndex: number;
  name?: string;
  block: number;
  initialAccFeeLong: number;
  initialAccFeeShort: number;
  prevGroupAccFeeLong: number;
  prevGroupAccFeeShort: number;
  pairAccFeeLong: number;
  pairAccFeeShort: number;
};

export type BorrowingOi = {
  oi: OpenInterest;
};

export type BorrowingFeePerBlockCap = {
  minP: number;
  maxP: number;
};

export type Pair = BorrowingData &
  BorrowingOi & {
    groups: PairGroup[];
    feePerBlockCap?: BorrowingFeePerBlockCap;
  };

export type Group = BorrowingData & BorrowingOi;

export type InitialAccFees = {
  accPairFee: number;
  accGroupFee: number;
  block: number;
};
