import { Trade } from "../types";

export type ValidateCounterTradeContext = {
  pairOiSkewCollateral: number; // Dynamic skew in collateral (can be pre-adjusted with buffer by caller)
};

export type ValidateCounterTradeResult = {
  isValidated: boolean;
  exceedingPositionSizeCollateral: number;
};