import { ITradingStorage } from "src/contracts/types/generated/GNSMultiCollatDiamond";
import { CollateralConfig } from "./types";

export const convertCollateralConfig = (
  collateral: ITradingStorage.CollateralStructOutput & {
    decimals: number;
  }
): CollateralConfig => ({
  collateral: collateral.collateral,
  isActive: collateral.isActive,
  precision: Number(collateral.precision),
  precisionDelta: Number(collateral.precisionDelta),
  decimals: collateral.decimals,
});
