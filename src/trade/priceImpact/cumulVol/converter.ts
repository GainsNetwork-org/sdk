/**
 * @dev Converters for cumulative volume price impact data between contract and SDK formats
 * @dev All BigNumber values are normalized to floats with appropriate precision
 */

import { IPriceImpact } from "../../../contracts/types/generated/GNSMultiCollatDiamond";
import { OiWindowsSettings, OiWindow, OiWindows } from "../../types";

/**
 * @dev Converts contract OI windows settings to SDK format
 * @param contractData Contract OiWindowsSettings struct
 * @returns Normalized OI windows settings
 */
export const convertOiWindowsSettings = (
  contractData: IPriceImpact.OiWindowsSettingsStructOutput
): OiWindowsSettings => {
  return {
    startTs: Number(contractData.startTs),
    windowsDuration: Number(contractData.windowsDuration),
    windowsCount: Number(contractData.windowsCount),
  };
};

/**
 * @dev Converts contract PairOi data to SDK OiWindow format
 * @param contractData Contract PairOi struct with USD values
 * @returns Normalized OI window data
 */
export const convertOiWindow = (
  contractData: IPriceImpact.PairOiStructOutput
): OiWindow => {
  // USD values are stored as 1e18 in contract
  return {
    oiLongUsd: Number(contractData.oiLongUsd) / 1e18,
    oiShortUsd: Number(contractData.oiShortUsd) / 1e18,
  };
};

/**
 * @dev Converts array of OI windows from contract format
 * @param windowIds Array of window IDs (as strings for mapping)
 * @param contractWindows Array of PairOi data from contract
 * @returns Normalized OI windows mapping
 */
export const convertOiWindows = (
  windowIds: string[],
  contractWindows: IPriceImpact.PairOiStructOutput[]
): OiWindows => {
  if (windowIds.length !== contractWindows.length) {
    throw new Error("Window IDs and data arrays must have the same length");
  }

  const windows: OiWindows = {};
  windowIds.forEach((id, index) => {
    windows[id] = convertOiWindow(contractWindows[index]);
  });

  return windows;
};

/**
 * @dev Batch converter for multiple OI windows settings
 * @param contractDataArray Array of contract OiWindowsSettings
 * @returns Array of normalized OI windows settings
 */
export const convertOiWindowsSettingsArray = (
  contractDataArray: IPriceImpact.OiWindowsSettingsStructOutput[]
): OiWindowsSettings[] => {
  return contractDataArray.map(convertOiWindowsSettings);
};
