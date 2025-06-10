/**
 * @dev Converters for trading fee data between contract and SDK formats
 */

import { CounterTradeSettingsBackend } from "src/backend";
import { CounterTradeSettings } from "../../types";
import { GlobalTradeFeeParams } from "./types";

/**
 * @dev Converts contract counter trade settings to SDK format
 * @param feeRateMultiplier Fee rate multiplier from contract (1e3 precision)
 * @param maxLeverage Max leverage from contract (1e3 precision)
 * @returns Normalized counter trade settings
 */
export const convertCounterTradeSettings = (
  feeRateMultiplier: number,
  maxLeverage: number
): CounterTradeSettings => {
  return {
    feeRateMultiplier: feeRateMultiplier / 1000, // 1e3 → float
    maxLeverage: maxLeverage / 1000, // 1e3 → float
  };
};

export const convertCounterTradeSettingsArray = (
  settings: CounterTradeSettingsBackend[]
): CounterTradeSettings[] => {
  return settings.map(setting =>
    convertCounterTradeSettings(
      Number(setting.feeRateMultiplier),
      Number(setting.maxLeverage)
    )
  );
};

/**
 * @dev Converts array of counter trade fee rate multipliers from contract
 * @param multipliers Array of fee rate multipliers (1e3 precision)
 * @returns Array of normalized multipliers
 */
export const convertCounterTradeFeeRateMultipliers = (
  multipliers: number[]
): number[] => {
  return multipliers.map(m => m / 1000);
};

/**
 * @dev Converts global trade fee params from contract to SDK format
 * @param contractParams Global trade fee params from contract
 * @returns Normalized global trade fee params
 */
export const convertGlobalTradeFeeParams = (contractParams: {
  referralFeeP: number;
  govFeeP: number;
  triggerOrderFeeP: number;
  gnsOtcFeeP: number;
  gTokenFeeP: number;
}): GlobalTradeFeeParams => {
  return {
    referralFeeP: contractParams.referralFeeP / 1e10 / 100, // 1e10 → percentage
    govFeeP: contractParams.govFeeP / 1e10 / 100,
    triggerOrderFeeP: contractParams.triggerOrderFeeP / 1e10 / 100,
    gnsOtcFeeP: contractParams.gnsOtcFeeP / 1e10 / 100,
    gTokenFeeP: contractParams.gTokenFeeP / 1e10 / 100,
  };
};
