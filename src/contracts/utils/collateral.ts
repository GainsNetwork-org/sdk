/**
 * @dev Collateral utility functions
 */

import { ChainId, CollateralTypes } from "../types";

// Known decimals by chain and collateral index
const CHAIN_COLLATERAL_DECIMALS: Record<number, Record<number, number>> = {
  137: { 1: 18, 2: 18, 3: 6 }, // Polygon: DAI=18, ETH=18, USDC=6
  42161: { 1: 18, 2: 18, 3: 6, 4: 18 }, // Arbitrum: DAI=18, ETH=18, USDC=6, GNS=18
  421614: { 1: 18, 2: 18, 3: 6, 4: 18 }, // Arbitrum Sepolia: DAI=18, ETH=18, USDC=6, GNS=18
  8453: { 1: 6 }, // Base: USDC=6
  33139: { 1: 18 }, // ApeChain: APE=18
};

/**
 * @dev Returns the decimals for a collateral on a specific chain
 * @param chainId The chain ID
 * @param collateral The collateral type
 * @returns The number of decimals for the collateral
 * @throws Error if the collateral is not configured for the chain
 */
export const getCollateralDecimalsForCollateralType = (
  chainId: ChainId,
  collateral: CollateralTypes
): number => {
  const decimalsMap: Record<
    ChainId,
    Partial<Record<CollateralTypes, number>>
  > = {
    [ChainId.POLYGON]: {
      [CollateralTypes.DAI]: 18,
      [CollateralTypes.ETH]: 18,
      [CollateralTypes.USDC]: 6,
    },
    [ChainId.ARBITRUM]: {
      [CollateralTypes.DAI]: 18,
      [CollateralTypes.ETH]: 18,
      [CollateralTypes.USDC]: 6,
      [CollateralTypes.GNS]: 18,
    },
    [ChainId.ARBITRUM_SEPOLIA]: {
      [CollateralTypes.DAI]: 18,
      [CollateralTypes.ETH]: 18,
      [CollateralTypes.USDC]: 6,
      [CollateralTypes.GNS]: 18,
    },
    [ChainId.BASE]: {
      [CollateralTypes.USDC]: 6,
    },
    [ChainId.APECHAIN]: {
      [CollateralTypes.APE]: 18,
    },
  };

  const decimals = decimalsMap[chainId]?.[collateral];
  if (decimals === undefined) {
    throw new Error(
      `Collateral ${collateral} not configured for chain ${chainId}`
    );
  }

  return decimals;
};

/**
 * @dev Helper to get collateral decimals for a chain and array of collateral indices
 * @param chainId Chain ID
 * @param collateralIndices Array of collateral indices
 * @returns Array of decimals (can be hardcoded for known chains)
 */
export const getCollateralDecimalsForChain = (
  chainId: number,
  collateralIndices: number[]
): number[] => {
  const decimalsForChain = CHAIN_COLLATERAL_DECIMALS[chainId] || {};

  return collateralIndices.map(index => decimalsForChain[index] || 18);
};
