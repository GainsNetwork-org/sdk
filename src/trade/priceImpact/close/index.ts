/**
 * @dev Trade closing price impact calculations
 * @dev Mirrors contract's TradingCommonUtils.getTradeClosingPriceImpact
 */

import {
  TradeClosingPriceImpactInput,
  TradeClosingPriceImpactContext,
  TradeClosingPriceImpactResult,
} from "./types";
import { getFixedSpreadP, getTradeCumulVolPriceImpactP } from "../cumulVol";
import { getTradeSkewPriceImpactWithChecks } from "../skew";
import { ContractsVersion } from "../../../contracts/types";

// Re-export types
export type {
  TradeClosingPriceImpactInput,
  TradeClosingPriceImpactContext,
  TradeClosingPriceImpactResult,
};

/**
 * @dev Calculates position size in tokens for partial close
 * @param originalPositionSizeToken Original position size in tokens
 * @param originalCollateral Original collateral amount
 * @param closingCollateral Collateral amount being closed
 * @returns Proportional position size in tokens
 */
const calculateClosingPositionSizeToken = (
  originalPositionSizeToken: number,
  originalCollateral: number,
  closingCollateral: number
): number => {
  if (originalCollateral === 0) return 0;

  // Proportional calculation: (closingCollateral / originalCollateral) * originalPositionSizeToken
  return (closingCollateral * originalPositionSizeToken) / originalCollateral;
};

/**
 * @dev Calculates all price impacts for trade closing
 * @dev Mirrors contract's getTradeClosingPriceImpact function
 * @param input Trade parameters
 * @param context Combined context for calculations
 * @returns Price impact breakdown and trade value
 */
export const getTradeClosingPriceImpact = (
  input: TradeClosingPriceImpactInput,
  context: TradeClosingPriceImpactContext
): TradeClosingPriceImpactResult => {
  // For trades before V9.2, return oracle price without any impact
  if (input.contractsVersion === ContractsVersion.BEFORE_V9_2) {
    return {
      positionSizeToken: 0,
      fixedSpreadP: 0,
      cumulVolPriceImpactP: 0,
      skewPriceImpactP: 0,
      totalPriceImpactP: 0,
      priceAfterImpact: input.oraclePrice,
      tradeValueCollateralNoFactor: 0,
    };
  }

  // Calculate position size in tokens (proportional to collateral being closed)
  const positionSizeToken = input.trade.positionSizeToken
    ? calculateClosingPositionSizeToken(
        input.trade.positionSizeToken,
        input.trade.collateralAmount,
        input.positionSizeCollateral
      )
    : 0;

  // Calculate fixed spread (reversed for closing)
  const fixedSpreadP = getFixedSpreadP(
    input.pairSpreadP,
    input.trade.long,
    false // closing
  );

  let cumulVolPriceImpactP = 0;
  let tradeValueCollateralNoFactor = 0;

  if (input.useCumulativeVolPriceImpact) {
    // First pass: Calculate with negative PnL assumption
    const positionSizeUsd =
      input.positionSizeCollateral * context.collateralPriceUsd;

    cumulVolPriceImpactP = getTradeCumulVolPriceImpactP(
      input.trade.user,
      input.pairIndex,
      input.trade.long,
      positionSizeUsd,
      false, // Assume negative PnL initially
      false, // closing
      context.tradeInfo.lastPosIncreaseBlock || context.tradeInfo.createdBlock,
      {
        ...context,
        isOpen: false,
        isPnlPositive: false, // Initial assumption
        contractsVersion: input.contractsVersion,
        createdBlock: context.tradeInfo.createdBlock,
      }
    );

    // Calculate price with conservative impact
    const priceWithImpact = input.trade.long
      ? input.currentPairPrice *
        (1 - (fixedSpreadP + cumulVolPriceImpactP) / 100)
      : input.currentPairPrice /
        (1 - (fixedSpreadP + cumulVolPriceImpactP) / 100);

    // Calculate trade value in collateral
    // For long: value = positionSizeToken * priceWithImpact
    // For short: value = positionSizeToken / priceWithImpact * openPrice^2 / currentPrice
    if (positionSizeToken > 0) {
      if (input.trade.long) {
        tradeValueCollateralNoFactor = positionSizeToken * priceWithImpact;
      } else {
        // Short calculation: profit from price decrease
        const pnlFactor =
          (2 * input.trade.openPrice - priceWithImpact) / input.trade.openPrice;
        tradeValueCollateralNoFactor = input.positionSizeCollateral * pnlFactor;
      }
    } else {
      tradeValueCollateralNoFactor = input.positionSizeCollateral;
    }

    // Determine actual PnL
    const isPnlPositive =
      tradeValueCollateralNoFactor > input.trade.collateralAmount;

    // Second pass: Recalculate with actual PnL if positive
    if (isPnlPositive) {
      cumulVolPriceImpactP = getTradeCumulVolPriceImpactP(
        input.trade.user,
        input.pairIndex,
        input.trade.long,
        positionSizeUsd,
        true, // Positive PnL
        false, // closing
        context.tradeInfo.lastPosIncreaseBlock ||
          context.tradeInfo.createdBlock,
        {
          ...context,
          isOpen: false,
          isPnlPositive: true,
          contractsVersion: input.contractsVersion,
          createdBlock: context.tradeInfo.createdBlock,
        }
      );
    }
  }

  // Calculate skew price impact (v10+ only)
  const skewPriceImpactP =
    input.contractsVersion === ContractsVersion.V10
      ? getTradeSkewPriceImpactWithChecks(
          {
            collateralIndex: input.collateralIndex,
            pairIndex: input.pairIndex,
            long: input.trade.long,
            open: false, // closing
            positionSizeCollateral: input.positionSizeCollateral,
            currentPrice: input.currentPairPrice,
            contractsVersion: input.contractsVersion,
            isCounterTrade: input.trade.isCounterTrade,
          },
          context.skewContext
        )
      : 0;

  // Total price impact (all components)
  const totalPriceImpactP =
    fixedSpreadP + cumulVolPriceImpactP + skewPriceImpactP;

  // Calculate final price after all impacts
  // For closing: longs get worse price when impact is positive, shorts get better
  const priceAfterImpact = input.trade.long
    ? input.currentPairPrice * (1 - totalPriceImpactP / 100)
    : input.currentPairPrice / (1 - totalPriceImpactP / 100);

  return {
    positionSizeToken,
    fixedSpreadP,
    cumulVolPriceImpactP,
    skewPriceImpactP,
    totalPriceImpactP,
    priceAfterImpact,
    tradeValueCollateralNoFactor,
  };
};

/**
 * @dev Simplified version using oracle price as current price
 * @param input Trade parameters (without currentPairPrice)
 * @param context Combined context
 * @returns Price impact breakdown and trade value
 */
export const getTradeClosingPriceImpactAtOracle = (
  input: Omit<TradeClosingPriceImpactInput, "currentPairPrice">,
  context: TradeClosingPriceImpactContext
): TradeClosingPriceImpactResult => {
  return getTradeClosingPriceImpact(
    {
      ...input,
      currentPairPrice: input.oraclePrice,
    },
    context
  );
};
