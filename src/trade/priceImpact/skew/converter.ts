/**
 * @dev Converters for skew price impact data between contract and SDK formats
 * @dev All BigNumber values are normalized to floats with appropriate precision
 */

import { IPriceImpact } from "../../../contracts/types/generated/GNSMultiCollatDiamond";
import {
  PairOiToken,
  PairOiCollateral,
  SkewDepth,
  SkewPriceImpactContext,
} from "./types";

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
 * @dev Normalizes skew depth from contract format
 * @param depth Skew depth from contract (in collateral wei)
 * @param collateralDecimals Number of decimals for the collateral
 * @returns Normalized skew depth
 */
export const normalizeSkewDepth = (
  depth: bigint | number | string,
  collateralDecimals: number
): number => {
  const divisor = 10 ** collateralDecimals;
  return Number(depth) / divisor;
};

/**
 * @dev Creates a skew depth object
 * @param collateralIndex Collateral index
 * @param pairIndex Pair index
 * @param depth Normalized depth value
 * @returns Skew depth object
 */
export const createSkewDepth = (
  collateralIndex: number,
  pairIndex: number,
  depth: number
): SkewDepth => {
  return {
    collateralIndex,
    pairIndex,
    depth,
  };
};

/**
 * @dev Creates skew price impact context from arrays of data
 * @param collateralIndices Array of collateral indices
 * @param pairIndices Array of pair indices
 * @param skewDepths Array of normalized skew depths
 * @param pairOiTokens Array of pair OI token data
 * @returns Complete skew price impact context
 */
export const createSkewPriceImpactContext = (
  collateralIndices: number[],
  pairIndices: number[],
  skewDepths: number[],
  pairOiTokens: PairOiToken[]
): SkewPriceImpactContext => {
  if (
    collateralIndices.length !== pairIndices.length ||
    pairIndices.length !== skewDepths.length ||
    skewDepths.length !== pairOiTokens.length
  ) {
    throw new Error("All input arrays must have the same length");
  }

  const context: SkewPriceImpactContext = {
    skewDepths: {},
    pairOiTokens: {},
  };

  // Build nested objects indexed by collateralIndex and pairIndex
  for (let i = 0; i < collateralIndices.length; i++) {
    const collateralIndex = collateralIndices[i];
    const pairIndex = pairIndices[i];

    // Initialize collateral index objects if they don't exist
    if (!context.skewDepths[collateralIndex]) {
      context.skewDepths[collateralIndex] = {};
    }
    if (!context.pairOiTokens[collateralIndex]) {
      context.pairOiTokens[collateralIndex] = {};
    }

    // Store data
    context.skewDepths[collateralIndex][pairIndex] = skewDepths[i];
    context.pairOiTokens[collateralIndex][pairIndex] = pairOiTokens[i];
  }

  return context;
};

/**
 * @dev Validates skew depth is within reasonable bounds
 * @param depth Normalized skew depth
 * @param minDepth Minimum allowed depth (default: 0)
 * @param maxDepth Maximum allowed depth (default: 1e12)
 * @returns Whether depth is valid
 */
export const isValidSkewDepth = (
  depth: number,
  minDepth = 0,
  maxDepth = 1e12
): boolean => {
  return depth >= minDepth && depth <= maxDepth;
};

/**
 * @dev Converts contract skew depths array to normalized values
 * @param contractDepths Array of depths from contract
 * @param collateralDecimals Array of decimals for each collateral
 * @returns Array of normalized depths
 */
export const convertSkewDepthsArray = (
  contractDepths: Array<bigint | number | string>,
  collateralDecimals: number[]
): number[] => {
  if (contractDepths.length !== collateralDecimals.length) {
    throw new Error(
      "Contract depths array and collateral decimals array must have the same length"
    );
  }

  return contractDepths.map((depth, index) =>
    normalizeSkewDepth(depth, collateralDecimals[index])
  );
};

/**
 * @dev Merges multiple contexts into one
 * @param contexts Array of contexts to merge
 * @returns Merged context
 */
export const mergeSkewPriceImpactContexts = (
  contexts: SkewPriceImpactContext[]
): SkewPriceImpactContext => {
  const merged: SkewPriceImpactContext = {
    skewDepths: {},
    pairOiTokens: {},
  };

  for (const context of contexts) {
    // Merge skew depths
    for (const collateralIndex in context.skewDepths) {
      if (!merged.skewDepths[collateralIndex]) {
        merged.skewDepths[collateralIndex] = {};
      }
      Object.assign(
        merged.skewDepths[collateralIndex],
        context.skewDepths[collateralIndex]
      );
    }

    // Merge pair OI tokens
    for (const collateralIndex in context.pairOiTokens) {
      if (!merged.pairOiTokens[collateralIndex]) {
        merged.pairOiTokens[collateralIndex] = {};
      }
      Object.assign(
        merged.pairOiTokens[collateralIndex],
        context.pairOiTokens[collateralIndex]
      );
    }
  }

  return merged;
};
