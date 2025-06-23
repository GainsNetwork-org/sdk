/**
 * @dev Converters for skew price impact data between contract and SDK formats
 * @dev All BigNumber values are normalized to floats with appropriate precision
 */

import { IPriceImpact } from "../../../contracts/types/generated/GNSMultiCollatDiamond";
import { PairOiToken, PairOiCollateral } from "./types";

/**
 * @dev Converts contract pair OI token data to SDK format
 * @param contractData Contract pair OI token struct
 * @returns Normalized pair OI token data
 */
export const convertPairOiToken = (
  contractData: IPriceImpact.PairOiTokenStruct
): PairOiToken => {
  // Token amounts are stored as 1e18 in contract
  return {
    oiLongToken: Number(contractData.oiLongToken) / 1e18,
    oiShortToken: Number(contractData.oiShortToken) / 1e18,
  };
};

/**
 * @dev Converts array of contract pair OI token data to SDK format
 * @param contractDataArray Array of contract pair OI token data
 * @returns Array of normalized pair OI token data
 */
export const convertPairOiTokenArray = (
  contractDataArray: IPriceImpact.PairOiTokenStruct[]
): PairOiToken[] => {
  return contractDataArray.map(convertPairOiToken);
};

/**
 * @dev Converts contract pair OI collateral data to SDK format
 * @param contractData Contract pair OI collateral struct
 * @param collateralDecimals Number of decimals for the collateral (e.g., 18 for DAI, 6 for USDC)
 * @returns Normalized pair OI collateral data
 */
export const convertPairOiCollateral = (
  contractData: IPriceImpact.PairOiCollateralStruct,
  collateralDecimals: number
): PairOiCollateral => {
  const divisor = 10 ** collateralDecimals;
  return {
    oiLongCollateral: Number(contractData.oiLongCollateral) / divisor,
    oiShortCollateral: Number(contractData.oiShortCollateral) / divisor,
  };
};

/**
 * @dev Converts array of contract pair OI collateral data to SDK format
 * @param contractDataArray Array of contract pair OI collateral data
 * @param collateralDecimals Array of collateral decimals for each entry
 * @returns Array of normalized pair OI collateral data
 */
export const convertPairOiCollateralArray = (
  contractDataArray: IPriceImpact.PairOiCollateralStruct[],
  collateralDecimals: number[]
): PairOiCollateral[] => {
  if (contractDataArray.length !== collateralDecimals.length) {
    throw new Error(
      "Contract data array and collateral decimals array must have the same length"
    );
  }

  return contractDataArray.map((data, index) =>
    convertPairOiCollateral(data, collateralDecimals[index])
  );
};

/**
 * @dev Converts skew depth from contract format to SDK format
 * @param depth Skew depth from contract (in token units with 1e18 precision)
 * @returns Normalized skew depth in tokens
 */
export const convertSkewDepth = (depth: string): number => {
  // Token depths are always stored with 1e18 precision in the contract
  return Number(depth) / 1e18;
};

/**
 * @dev Converts array of skew depths from contract format to SDK format
 * @param depths Array of skew depths from contract (in token units with 1e18 precision)
 * @returns Object mapping pair index to normalized depth
 */
export const convertPairSkewDepths = (
  depths: string[]
): { [pairIndex: number]: number } => {
  const result: { [pairIndex: number]: number } = {};

  depths.forEach((depth, index) => {
    if (depth && depth !== "0") {
      result[index] = convertSkewDepth(depth);
    }
  });

  return result;
};
