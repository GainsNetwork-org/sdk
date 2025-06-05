/**
 * @dev Fetchers for retrieving OI data from contracts
 * @dev Consolidates the three OI storage systems into unified format
 */

import { ethers } from "ethers";
import { getContractAddressesForChain } from "../../contracts";
import { GNSMultiCollatDiamond__factory } from "../../contracts/types/generated";
import { ChainId } from "../../contracts/types";
import { UnifiedPairOi } from "./types";
import {
  convertPairOi,
  convertPairOiArray,
  convertBeforeV10Collateral,
  convertTokenOi,
} from "./converter";

/**
 * @dev Fetches all OI data for a single pair
 * @param chainId Target chain
 * @param collateralIndex Collateral type
 * @param pairIndex Trading pair
 * @param signer Ethers signer
 * @returns Unified PairOi structure with all OI data
 */
export async function fetchPairOi(
  chainId: ChainId,
  collateralIndex: number,
  pairIndex: number,
  signer: ethers.Signer
): Promise<UnifiedPairOi> {
  const addresses = getContractAddressesForChain(chainId);
  const diamond = GNSMultiCollatDiamond__factory.connect(
    addresses.gnsMultiCollatDiamond,
    signer
  );

  // Fetch all three OI types in parallel
  const [beforeV10Raw, afterV10Collateral, afterV10Token, maxOi, collateral] =
    await Promise.all([
      diamond.getPairOisBeforeV10Collateral(collateralIndex, pairIndex),
      diamond.getPairOiAfterV10Collateral(collateralIndex, pairIndex),
      diamond.getPairOiAfterV10Token(collateralIndex, pairIndex),
      diamond.getPairMaxOi(collateralIndex, pairIndex),
      diamond.getCollateral(collateralIndex),
    ]);

  // Convert the beforeV10 format to match expected structure
  const beforeV10 = {
    long: beforeV10Raw.longOi,
    short: beforeV10Raw.shortOi,
    max: maxOi,
    __placeholder: ethers.BigNumber.from(0)
  };

  return convertPairOi(
    beforeV10 as any,
    afterV10Collateral,
    afterV10Token,
    Number(collateral.precision)
  );
}

/**
 * @dev Fetches OI data for multiple pairs efficiently
 * @param chainId Target chain
 * @param collateralIndex Collateral type
 * @param pairIndices Array of trading pairs
 * @param signer Ethers signer
 * @returns Array of unified PairOi structures
 */
export async function fetchMultiplePairOi(
  chainId: ChainId,
  collateralIndex: number,
  pairIndices: number[],
  signer: ethers.Signer
): Promise<UnifiedPairOi[]> {
  const addresses = getContractAddressesForChain(chainId);
  const diamond = GNSMultiCollatDiamond__factory.connect(
    addresses.gnsMultiCollatDiamond,
    signer
  );

  // Get collateral precision once
  const collateral = await diamond.getCollateral(collateralIndex);
  const precision = Number(collateral.precision);

  // Batch fetch all OI data
  const promises = pairIndices.map(async pairIndex => {
    const [beforeV10Raw, afterV10Collateral, afterV10Token, maxOi] =
      await Promise.all([
        diamond.getPairOisBeforeV10Collateral(collateralIndex, pairIndex),
        diamond.getPairOiAfterV10Collateral(collateralIndex, pairIndex),
        diamond.getPairOiAfterV10Token(collateralIndex, pairIndex),
        diamond.getPairMaxOi(collateralIndex, pairIndex),
      ]);

    // Convert the beforeV10 format to match expected structure
    const beforeV10 = {
      long: beforeV10Raw.longOi,
      short: beforeV10Raw.shortOi,
      max: maxOi,
      __placeholder: ethers.BigNumber.from(0),
    };

    return {
      beforeV10: beforeV10 as any,
      afterV10Collateral,
      afterV10Token
    };
  });

  const results = await Promise.all(promises);
  return convertPairOiArray(results, precision);
}

/**
 * @dev Creates OI context for fee calculations
 * @param chainId Target chain
 * @param collateralIndex Collateral type
 * @param pairIndex Trading pair
 * @param signer Ethers signer
 * @returns OI data formatted for SDK calculations
 */
export async function createOiContext(
  chainId: ChainId,
  collateralIndex: number,
  pairIndex: number,
  signer: ethers.Signer
): Promise<{
  pairOi: UnifiedPairOi;
  currentPrice: number;
  computed: {
    totalDynamicOi: { long: number; short: number };
    totalStaticOi: { long: number; short: number };
    skew: number;
  };
}> {
  // Fetch OI data
  const pairOi = await fetchPairOi(chainId, collateralIndex, pairIndex, signer);

  // For now, use a placeholder price - in real usage, this would come from price feeds
  // The actual price should be fetched from the price aggregator or oracle
  const currentPrice = 1; // Placeholder - replace with actual price fetching

  // Compute derived values
  const totalDynamicOi = {
    long: pairOi.beforeV10Collateral.long + pairOi.token.long * currentPrice,
    short: pairOi.beforeV10Collateral.short + pairOi.token.short * currentPrice,
  };

  const totalStaticOi = {
    long: pairOi.beforeV10Collateral.long + pairOi.collateral.long,
    short: pairOi.beforeV10Collateral.short + pairOi.collateral.short,
  };

  const skew = pairOi.token.long - pairOi.token.short;

  return {
    pairOi,
    currentPrice,
    computed: {
      totalDynamicOi,
      totalStaticOi,
      skew,
    },
  };
}

/**
 * @dev Fetches only the OI data needed for specific use cases
 * @param chainId Target chain
 * @param collateralIndex Collateral type
 * @param pairIndex Trading pair
 * @param useCase Which OI systems to fetch
 * @param signer Ethers signer
 * @returns Partial OI data based on use case
 */
export async function fetchOiForUseCase(
  chainId: ChainId,
  collateralIndex: number,
  pairIndex: number,
  useCase: "skew" | "funding" | "borrowingV1" | "limits",
  signer: ethers.Signer
): Promise<Partial<UnifiedPairOi>> {
  const addresses = getContractAddressesForChain(chainId);
  const diamond = GNSMultiCollatDiamond__factory.connect(
    addresses.gnsMultiCollatDiamond,
    signer
  );

  switch (useCase) {
    case "skew":
    case "funding": {
      // Only need token OI
      const tokenOi = await diamond.getPairOiAfterV10Token(
        collateralIndex,
        pairIndex
      );
      return {
        token: convertTokenOi(tokenOi),
      };
    }

    case "borrowingV1": {
      // Need beforeV10 and token (for dynamic calculation)
      const [beforeV10Raw, tokenOi, collateral, maxOi] = await Promise.all([
        diamond.getPairOisBeforeV10Collateral(collateralIndex, pairIndex),
        diamond.getPairOiAfterV10Token(collateralIndex, pairIndex),
        diamond.getCollateral(collateralIndex),
        diamond.getPairMaxOi(collateralIndex, pairIndex),
      ]);

      // Convert the beforeV10 format to match expected structure
      const beforeV10 = {
        long: beforeV10Raw.longOi,
        short: beforeV10Raw.shortOi,
        max: maxOi,
        __placeholder: ethers.BigNumber.from(0),
      };

      return {
        beforeV10Collateral: convertBeforeV10Collateral(
          beforeV10 as any,
          Number(collateral.precision)
        ),
        token: convertTokenOi(tokenOi),
      };
    }

    case "limits": {
      // Need all OI for limit checks
      return fetchPairOi(chainId, collateralIndex, pairIndex, signer);
    }

    default:
      throw new Error(`Unknown use case: ${String(useCase)}`);
  }
}
