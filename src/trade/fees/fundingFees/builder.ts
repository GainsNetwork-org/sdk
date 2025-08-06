/**
 * @dev Builder functions for funding fees context
 */

import { getPairV10OiTokenSkewCollateral } from "../../../markets/oi/index";
import { GlobalTradingVariablesType } from "../../../backend/tradingVariables/types";
import { GetPairFundingFeeContext } from "./pairContext";

/**
 * @dev Builds funding fees sub-context for a specific pair
 */
export const buildFundingContext = (
  globalTradingVariables: GlobalTradingVariablesType,
  collateralIndex: number,
  pairIndex: number,
  currentTimestamp: number
): GetPairFundingFeeContext | undefined => {
  const collateral = globalTradingVariables.collaterals[collateralIndex - 1];
  if (!collateral?.pairFundingFees) {
    return undefined;
  }

  const params = collateral.pairFundingFees.params?.[pairIndex];
  const data = collateral.pairFundingFees.data?.[pairIndex];
  const pairOi = collateral.pairOis?.[pairIndex];
  const netExposureToken = getPairV10OiTokenSkewCollateral(pairIndex, {
    pairOis: collateral.pairOis,
  });

  if (!params || !data) {
    return undefined;
  }

  return {
    params,
    data,
    pairOi: pairOi
      ? {
          oiLongToken: pairOi.token?.long || 0,
          oiShortToken: pairOi.token?.short || 0,
        }
      : undefined,
    currentTimestamp,
    netExposureToken,
  };
};
