import type { GNSMultiCollatDiamond } from "../../types/generated";
import type {
  PairOiToken,
  SkewPriceImpactContext,
} from "../../../trade/priceImpact";
import {
  convertPairOiToken,
  normalizeSkewDepth,
  createSkewPriceImpactContext,
} from "../../../trade/priceImpact";

/**
 * @dev Fetches pair open interest in tokens for a specific pair
 * @param contract GNSMultiCollatDiamond contract instance
 * @param collateralIndex Collateral index
 * @param pairIndex Pair index
 * @returns Promise resolving to pair OI in tokens
 */
export const fetchPairOiAfterV10Token = async (
  contract: GNSMultiCollatDiamond,
  collateralIndex: number,
  pairIndex: number
): Promise<PairOiToken> => {
  try {
    const contractData = await contract.getPairOiAfterV10Token(
      collateralIndex,
      pairIndex
    );

    return convertPairOiToken(contractData);
  } catch (error) {
    console.error("Error fetching pair OI token:", error);
    throw error;
  }
};

/**
 * @dev Fetches pair open interest in tokens for multiple pairs
 * @param contract GNSMultiCollatDiamond contract instance
 * @param collateralIndices Array of collateral indices
 * @param pairIndices Array of pair indices
 * @returns Promise resolving to array of pair OI in tokens
 */
export const fetchPairOisAfterV10Token = async (
  contract: GNSMultiCollatDiamond,
  collateralIndices: number[],
  pairIndices: number[]
): Promise<PairOiToken[]> => {
  if (collateralIndices.length !== pairIndices.length) {
    throw new Error(
      "Collateral indices and pair indices arrays must have the same length"
    );
  }

  try {
    const contractDataArray = await contract.getPairOisAfterV10Token(
      collateralIndices,
      pairIndices
    );

    return contractDataArray.map(convertPairOiToken);
  } catch (error) {
    console.error("Error fetching pair OIs token:", error);
    throw error;
  }
};

/**
 * @dev Fetches skew depth for a specific pair
 * @param contract GNSMultiCollatDiamond contract instance
 * @param collateralIndex Collateral index
 * @param pairIndex Pair index
 * @param collateralDecimals Number of decimals for the collateral
 * @returns Promise resolving to normalized skew depth
 */
export const fetchPairSkewDepth = async (
  contract: GNSMultiCollatDiamond,
  collateralIndex: number,
  pairIndex: number,
  collateralDecimals: number
): Promise<number> => {
  try {
    const contractDepth = await contract.getPairSkewDepth(
      collateralIndex,
      pairIndex
    );

    return normalizeSkewDepth(contractDepth.toBigInt(), collateralDecimals);
  } catch (error) {
    console.error("Error fetching skew depth:", error);
    throw error;
  }
};

/**
 * @dev Fetches skew depths for multiple pairs
 * @param contract GNSMultiCollatDiamond contract instance
 * @param collateralIndices Array of collateral indices
 * @param pairIndices Array of pair indices
 * @param collateralDecimals Array of collateral decimals for each pair
 * @returns Promise resolving to array of normalized skew depths
 */
export const fetchPairSkewDepths = async (
  contract: GNSMultiCollatDiamond,
  collateralIndices: number[],
  pairIndices: number[],
  collateralDecimals: number[]
): Promise<number[]> => {
  if (
    collateralIndices.length !== pairIndices.length ||
    pairIndices.length !== collateralDecimals.length
  ) {
    throw new Error("All input arrays must have the same length");
  }

  try {
    const contractDepths = await contract.getPairSkewDepths(
      collateralIndices,
      pairIndices
    );

    return contractDepths.map((depth, i) =>
      normalizeSkewDepth(depth.toBigInt(), collateralDecimals[i])
    );
  } catch (error) {
    console.error("Error fetching skew depths:", error);
    throw error;
  }
};

/**
 * @dev Fetches complete skew price impact context for multiple pairs
 * @param contract GNSMultiCollatDiamond contract instance
 * @param collateralIndices Array of collateral indices
 * @param pairIndices Array of pair indices
 * @param collateralDecimals Array of collateral decimals for each pair
 * @returns Promise resolving to complete skew price impact context
 */
export const fetchSkewPriceImpactContext = async (
  contract: GNSMultiCollatDiamond,
  collateralIndices: number[],
  pairIndices: number[],
  collateralDecimals: number[]
): Promise<SkewPriceImpactContext> => {
  try {
    // Fetch OI data and skew depths in parallel
    const [pairOiTokens, skewDepths] = await Promise.all([
      fetchPairOisAfterV10Token(contract, collateralIndices, pairIndices),
      fetchPairSkewDepths(
        contract,
        collateralIndices,
        pairIndices,
        collateralDecimals
      ),
    ]);

    return createSkewPriceImpactContext(
      collateralIndices,
      pairIndices,
      skewDepths,
      pairOiTokens
    );
  } catch (error) {
    console.error("Error fetching skew price impact context:", error);
    throw error;
  }
};

/**
 * @dev Fetches collateral decimals for given collateral indices
 * @param contract GNSMultiCollatDiamond contract instance
 * @param collateralIndices Array of collateral indices
 * @returns Promise resolving to array of decimals
 */
export const fetchCollateralDecimals = async (
  contract: GNSMultiCollatDiamond,
  collateralIndices: number[]
): Promise<number[]> => {
  try {
    // Get unique collateral indices to minimize calls
    const uniqueIndices = [...new Set(collateralIndices)];

    // Fetch collateral info for unique indices
    const promises = uniqueIndices.map(async index => {
      const collateral = await contract.getCollateral(index);
      return { index, decimals: Number(collateral.precision) };
    });

    const collateralData = await Promise.all(promises);

    // Create a map for quick lookup
    const decimalsMap = new Map(
      collateralData.map(data => [data.index, data.decimals])
    );

    // Return decimals in the same order as input
    return collateralIndices.map(
      index => decimalsMap.get(index) || 18 // Default to 18 if not found
    );
  } catch (error) {
    console.error("Error fetching collateral decimals:", error);
    throw error;
  }
};

/**
 * @dev Helper to get collateral decimals for a chain
 * @param chainId Chain ID
 * @param collateralIndices Array of collateral indices
 * @returns Array of decimals (can be hardcoded for known chains)
 */
export const getCollateralDecimalsForChain = (
  chainId: number,
  collateralIndices: number[]
): number[] => {
  // Known decimals by chain and collateral index
  const chainDecimals: Record<number, Record<number, number>> = {
    137: { 1: 18, 2: 18, 3: 6 }, // Polygon: DAI=18, ETH=18, USDC=6
    42161: { 1: 18, 2: 18, 3: 6, 4: 18 }, // Arbitrum: DAI=18, ETH=18, USDC=6, GNS=18
    8453: { 1: 6 }, // Base: USDC=6
    33139: { 1: 18 }, // ApeChain: APE=18
  };

  const decimalsForChain = chainDecimals[chainId] || {};

  return collateralIndices.map(index => decimalsForChain[index] || 18);
};

/**
 * @dev Calculates skew price impact for a trade using contract call
 * @param contract GNSMultiCollatDiamond contract instance
 * @param collateralIndex Collateral index
 * @param pairIndex Pair index
 * @param long Whether trade is long
 * @param positionSizeToken Position size in tokens
 * @param open Whether trade is opening
 * @returns Promise resolving to price impact percentage (1e10)
 */
export const calculateTradeSkewPriceImpact = async (
  contract: GNSMultiCollatDiamond,
  collateralIndex: number,
  pairIndex: number,
  long: boolean,
  positionSizeToken: number,
  open: boolean
): Promise<number> => {
  try {
    const priceImpactP = await contract.getTradeSkewPriceImpactP(
      collateralIndex,
      pairIndex,
      long,
      BigInt(Math.round(positionSizeToken * 1e18)), // Convert to 1e18 precision
      open
    );

    // Convert from int256 1e10 to percentage
    return Number(priceImpactP) / 1e10;
  } catch (error) {
    console.error("Error calculating trade skew price impact:", error);
    throw error;
  }
};
