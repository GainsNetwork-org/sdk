import { Fee, PairIndex } from "../types";

export const getClosingFee = (
  posDai: number,
  leverage: number,
  pairIndex: PairIndex,
  pairFee: Fee | undefined
): number => {
  if (
    posDai === undefined ||
    leverage === undefined ||
    pairIndex === undefined ||
    pairFee === undefined
  ) {
    return 0;
  }

  const { closeFeeP, triggerOrderFeeP } = pairFee;

  return (closeFeeP + triggerOrderFeeP) * posDai * leverage;
};

export * from "./borrowing";
export * from "./tiers";
