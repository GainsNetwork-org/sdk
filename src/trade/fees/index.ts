import { Fee, PairIndex } from "../types";

export const getClosingFee = (
  posDai: number,
  leverage: number,
  pairIndex: PairIndex,
  pairFee: Fee | undefined,
  collateralPriceUsd?: number,
  feeMultiplier: number = 1,
): number => {
  if (
    posDai === undefined ||
    leverage === undefined ||
    pairIndex === undefined ||
    pairFee === undefined
  ) {
    return 0;
  }

  const { closeFeeP, triggerOrderFeeP, minPositionSizeUsd } = pairFee;

  return (
    (closeFeeP + triggerOrderFeeP) * feeMultiplier *
    Math.max(
      collateralPriceUsd && collateralPriceUsd > 0
        ? minPositionSizeUsd / collateralPriceUsd
        : 0,
      posDai * leverage
    )
  );
};

export * from "./borrowing";
export * from "./tiers";
