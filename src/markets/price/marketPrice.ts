/**
 * @dev Current market price calculation with skew impact
 */

import { MarketPriceResult, MarketPriceContext } from "./types";
import { getTradeSkewPriceImpact } from "../../trade/priceImpact/skew";

/**
 * @dev Calculates the current market price adjusted for skew impact
 * @param pairIndex Trading pair index
 * @param oraclePrice Oracle price for the pair
 * @param context Market price context with depths and OI data
 * @returns Current market price with skew impact applied
 */
export const getCurrentMarketPrice = (
  pairIndex: number,
  oraclePrice: number,
  context: MarketPriceContext
): MarketPriceResult => {
  let skewImpactP = 0;

  if (context.skewDepth > 0) {
    const skewResult = getTradeSkewPriceImpact(
      {
        collateralIndex: 0, // Not used for size 0
        pairIndex,
        long: true, // Not used for size 0
        open: true, // Not used for size 0
        positionSizeToken: 0, // Size 0 for current market price
      },
      context
    );

    skewImpactP = skewResult.priceImpactP;
  }

  const marketPrice = oraclePrice * (1 + skewImpactP / 100);

  return {
    marketPrice,
    skewImpactP,
    oraclePrice,
  };
};
