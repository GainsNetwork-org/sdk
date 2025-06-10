/**
 * @dev Converters for liquidation data between contract and SDK formats
 */

import { IPairsStorage } from "../../contracts/types/generated/GNSMultiCollatDiamond";
import { LiquidationParams } from "../types";

/**
 * @dev Converts contract liquidation params to SDK format
 * @param params Group liquidation params from contract
 * @returns Normalized liquidation params
 */
export const convertLiquidationParams = (
  params: IPairsStorage.GroupLiquidationParamsStructOutput
): LiquidationParams => {
  const ONCHAIN_LIQ_THRESHOLD = 0.9;
  return {
    maxLiqSpreadP: Number(params.maxLiqSpreadP) / 1e10 / 100, // 1e10 → percentage
    startLiqThresholdP:
      Number(params.startLiqThresholdP) / 1e10 / 100 || ONCHAIN_LIQ_THRESHOLD, // 1e10 → percentage
    endLiqThresholdP:
      Number(params.endLiqThresholdP) / 1e10 / 100 || ONCHAIN_LIQ_THRESHOLD, // 1e10 → percentage
    startLeverage: Number(params.startLeverage) / 1e3, // 1e3 → float
    endLeverage: Number(params.endLeverage) / 1e3, // 1e3 → float
  };
};

/**
 * @dev Converts array of liquidation params from contract
 * @param paramsArray Array of group liquidation params
 * @returns Array of normalized liquidation params
 */
export const convertLiquidationParamsArray = (
  paramsArray: IPairsStorage.GroupLiquidationParamsStructOutput[]
): LiquidationParams[] => {
  return paramsArray.map(convertLiquidationParams);
};

/**
 * @dev Converts liquidation params to contract format (for encoding)
 * @param params SDK liquidation params
 * @returns Contract-formatted liquidation params
 */
export const encodeLiquidationParams = (
  params: LiquidationParams
): IPairsStorage.GroupLiquidationParamsStruct => {
  return {
    maxLiqSpreadP: Math.round(params.maxLiqSpreadP * 100 * 1e10), // percentage → 1e10
    startLiqThresholdP: Math.round(params.startLiqThresholdP * 100 * 1e10), // percentage → 1e10
    endLiqThresholdP: Math.round(params.endLiqThresholdP * 100 * 1e10), // percentage → 1e10
    startLeverage: Math.round(params.startLeverage * 1e3), // float → 1e3
    endLeverage: Math.round(params.endLeverage * 1e3), // float → 1e3
  };
};
