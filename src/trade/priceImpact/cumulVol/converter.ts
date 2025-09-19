/**
 * @dev Converters for cumulative volume price impact data between contract and SDK formats
 * @dev All BigNumber values are normalized to floats with appropriate precision
 */

import { IPriceImpact } from "../../../contracts/types/generated/GNSMultiCollatDiamond";
import { OiWindowsSettings, OiWindow, OiWindows } from "../../types";
import { DepthBands, PairDepthBands, DepthBandsMapping } from "./types";
import { decodeDepthBands } from "../../../pricing/depthBands";

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

/**
 * @dev Converts decoded depth bands from contract to SDK format
 * @param totalDepthUsd Total depth in USD (already decoded from contract)
 * @param bandsBps Array of 30 band percentages in basis points from contract
 * @returns Normalized depth bands with bands in 0-1 range
 */
export const convertDepthBands = (
  totalDepthUsd: number,
  bandsBps: number[]
): DepthBands => {
  // Convert bands from basis points to 0-1 range
  const bands = bandsBps.map(bps => bps / 10000);

  return {
    totalDepthUsd,
    bands,
  };
};

/**
 * @dev Converts decoded pair depth bands from contract to SDK format
 * @param aboveDepth Decoded above depth bands from getPairDepthBandsDecoded
 * @param belowDepth Decoded below depth bands from getPairDepthBandsDecoded
 * @returns Normalized pair depth bands with above/below
 */
export const convertPairDepthBands = (
  aboveDepth: { totalDepthUsd: number; bands: number[] } | undefined,
  belowDepth: { totalDepthUsd: number; bands: number[] } | undefined
): PairDepthBands => {
  // Convert above bands if configured
  const above =
    aboveDepth && aboveDepth.totalDepthUsd > 0
      ? convertDepthBands(aboveDepth.totalDepthUsd, aboveDepth.bands)
      : undefined;

  // Convert below bands if configured
  const below =
    belowDepth && belowDepth.totalDepthUsd > 0
      ? convertDepthBands(belowDepth.totalDepthUsd, belowDepth.bands)
      : undefined;

  return {
    above,
    below,
  };
};

/**
 * @dev Converts decoded depth bands mapping from contract to SDK format
 * @param bandsBps Array of 30 band offset values in basis points from getDepthBandsMappingDecoded
 * @returns Normalized depth bands mapping with offset values in 0-1 range
 */
export const convertDepthBandsMapping = (
  bandsBps: number[]
): DepthBandsMapping => {
  // Convert bands from basis points to 0-1 range
  const bands = bandsBps.map(bps => bps / 10000);

  return {
    bands,
  };
};

/**
 * @dev Validates depth bands have correct number of bands
 * @param depthBands Depth bands to validate
 * @returns True if valid (30 bands)
 */
export const validateDepthBands = (depthBands: DepthBands): boolean => {
  return depthBands.bands.length === 30;
};

/**
 * @dev Validates depth bands mapping has correct number of bands
 * @param mapping Depth bands mapping to validate
 * @returns True if valid (30 bands)
 */
export const validateDepthBandsMapping = (
  mapping: DepthBandsMapping
): boolean => {
  return mapping.bands.length === 30;
};

/**
 * @dev Alternative converter for decoded pair depth bands from contract
 * @param contractData Decoded pair depth bands from getPairDepthBandsDecoded
 * @returns Normalized pair depth bands
 */
export const convertPairDepthBandsDecoded = (contractData: {
  above: { totalDepthUsd: number; bands: number[] };
  below: { totalDepthUsd: number; bands: number[] };
}): PairDepthBands => {
  return convertPairDepthBands(contractData.above, contractData.below);
};

/**
 * @dev Alternative converter for raw slot-based pair depth bands (if needed for legacy)
 * @param aboveSlot1 First slot for above bands
 * @param aboveSlot2 Second slot for above bands
 * @param belowSlot1 First slot for below bands
 * @param belowSlot2 Second slot for below bands
 * @returns Normalized pair depth bands
 */
export const convertPairDepthBandsFromSlots = (
  aboveSlot1: bigint,
  aboveSlot2: bigint,
  belowSlot1: bigint,
  belowSlot2: bigint
): PairDepthBands => {
  // Use the decoding functions from pricing module if raw slots are provided
  const above =
    aboveSlot1 !== BigInt(0) || aboveSlot2 !== BigInt(0)
      ? decodeDepthBands(aboveSlot1, aboveSlot2)
      : undefined;

  const below =
    belowSlot1 !== BigInt(0) || belowSlot2 !== BigInt(0)
      ? decodeDepthBands(belowSlot1, belowSlot2)
      : undefined;

  return convertPairDepthBands(above, below);
};
