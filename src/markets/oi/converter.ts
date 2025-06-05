/**
 * @dev Converters for OI data between contract and SDK formats
 * @dev Handles the three OI storage systems and precision conversions
 */

import { ethers } from "ethers";
import {
  IBorrowingFees,
  IPriceImpact,
} from "../../contracts/types/generated/GNSMultiCollatDiamond";
import { UnifiedPairOi, ComputedOi } from "./types";

/**
 * @dev Converts pre-v10 OI from contract format
 * @param contractOi Contract OpenInterest struct from BorrowingFeesStorage
 * @param precision Collateral precision for conversion
 * @returns Normalized OI with long/short values
 */
export const convertBeforeV10Collateral = (
  contractOi: IBorrowingFees.OpenInterestStructOutput,
  precision: number
): { long: number; short: number } => {
  return {
    long: Number(contractOi.long) / precision,
    short: Number(contractOi.short) / precision,
  };
};

/**
 * @dev Converts post-v10 collateral OI from contract format
 * @param contractOi Contract PairOiCollateral struct
 * @param precision Collateral precision for conversion
 * @returns Normalized OI with long/short values
 */
export const convertCollateralOi = (
  contractOi: IPriceImpact.PairOiCollateralStructOutput,
  precision: number
): { long: number; short: number } => {
  return {
    long: Number(contractOi.oiLongCollateral) / precision,
    short: Number(contractOi.oiShortCollateral) / precision,
  };
};

/**
 * @dev Converts post-v10 token OI from contract format
 * @param contractOi Contract PairOiToken struct
 * @returns Normalized OI with long/short values (1e18 precision)
 */
export const convertTokenOi = (
  contractOi: IPriceImpact.PairOiTokenStructOutput
): { long: number; short: number } => {
  return {
    long: Number(contractOi.oiLongToken) / 1e18,
    short: Number(contractOi.oiShortToken) / 1e18,
  };
};

/**
 * @dev Converts all OI data for a pair into unified structure
 * @param beforeV10 Pre-v10 OI from BorrowingFeesStorage
 * @param afterV10Collateral Post-v10 collateral OI from PriceImpactStorage
 * @param afterV10Token Post-v10 token OI from PriceImpactStorage
 * @param maxOi Maximum OI allowed (from BorrowingFeesStorage)
 * @param collateralPrecision Precision for collateral conversions
 * @returns Unified PairOi structure
 */
export const convertPairOi = (
  beforeV10: IBorrowingFees.OpenInterestStructOutput,
  afterV10Collateral: IPriceImpact.PairOiCollateralStructOutput,
  afterV10Token: IPriceImpact.PairOiTokenStructOutput,
  collateralPrecision: number
): UnifiedPairOi => {
  return {
    maxCollateral: Number(beforeV10.max) / collateralPrecision,
    beforeV10Collateral: convertBeforeV10Collateral(
      beforeV10,
      collateralPrecision
    ),
    collateral: convertCollateralOi(afterV10Collateral, collateralPrecision),
    token: convertTokenOi(afterV10Token),
  };
};

/**
 * @dev Batch converter for multiple pairs
 * @param pairs Array of OI data for multiple pairs
 * @param collateralPrecision Precision for collateral conversions
 * @returns Array of unified PairOi structures
 */
export const convertPairOiArray = (
  pairs: Array<{
    beforeV10: IBorrowingFees.OpenInterestStructOutput;
    afterV10Collateral: IPriceImpact.PairOiCollateralStructOutput;
    afterV10Token: IPriceImpact.PairOiTokenStructOutput;
  }>,
  collateralPrecision: number
): UnifiedPairOi[] => {
  return pairs.map(p =>
    convertPairOi(
      p.beforeV10,
      p.afterV10Collateral,
      p.afterV10Token,
      collateralPrecision
    )
  );
};

/**
 * @dev Computes derived OI values from unified structure
 * @param pairOi Unified pair OI data
 * @param tokenPriceCollateral Current token price in collateral units
 * @returns Computed values including total OI and skew
 */
export const computeOiValues = (
  pairOi: UnifiedPairOi,
  tokenPriceCollateral: number
): ComputedOi => {
  // Static total (used for admin operations)
  const totalStaticLong =
    pairOi.beforeV10Collateral.long + pairOi.collateral.long;
  const totalStaticShort =
    pairOi.beforeV10Collateral.short + pairOi.collateral.short;

  // Dynamic total (used for real-time calculations)
  const tokenLongCollateral = pairOi.token.long * tokenPriceCollateral;
  const tokenShortCollateral = pairOi.token.short * tokenPriceCollateral;
  const totalDynamicLong =
    pairOi.beforeV10Collateral.long + tokenLongCollateral;
  const totalDynamicShort =
    pairOi.beforeV10Collateral.short + tokenShortCollateral;

  // Skew (v10+ only, in tokens)
  const skewToken = pairOi.token.long - pairOi.token.short;

  return {
    totalStaticCollateral: {
      long: totalStaticLong,
      short: totalStaticShort,
    },
    totalDynamicCollateral: {
      long: totalDynamicLong,
      short: totalDynamicShort,
    },
    skewToken,
  };
};
