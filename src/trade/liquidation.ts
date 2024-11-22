import {
  getBorrowingFee,
  GetBorrowingFeeContext,
  BorrowingFee,
  getClosingFee,
} from "./fees";
import { Fee, LiquidationParams, Trade } from "./types";
import { getSpreadP } from "./spread";
import { ContractsVersion } from "../contracts/types";

export type GetLiquidationPriceContext = GetBorrowingFeeContext & {
  liquidationParams: LiquidationParams | undefined;
  pairSpreadP: number | undefined;
  collateralPriceUsd: number | undefined;
  contractsVersion: ContractsVersion | undefined;
};

export const getLiquidationPrice = (
  trade: Trade,
  fee: Fee,
  initialAccFees: BorrowingFee.InitialAccFees,
  context: GetLiquidationPriceContext
): number => {
  const closingFee = getClosingFee(
    trade.collateralAmount,
    trade.leverage,
    trade.pairIndex,
    fee,
    context.collateralPriceUsd
  );
  const borrowingFee = getBorrowingFee(
    trade.collateralAmount * trade.leverage,
    trade.pairIndex,
    trade.long,
    initialAccFees,
    context
  );
  const liqThresholdP = getLiqPnlThresholdP(
    context.liquidationParams,
    trade.leverage
  );

  let liqPriceDistance =
    (trade.openPrice *
      (trade.collateralAmount * liqThresholdP - (borrowingFee + closingFee))) /
    trade.collateralAmount /
    trade.leverage;

  if (
    context?.contractsVersion !== undefined &&
    context.contractsVersion >= ContractsVersion.V9_2 &&
    context?.liquidationParams?.maxLiqSpreadP !== undefined &&
    context.liquidationParams.maxLiqSpreadP > 0
  ) {
    const closingSpreadP = getSpreadP(
      context.pairSpreadP,
      true,
      context.liquidationParams
    );

    liqPriceDistance -= trade.openPrice * closingSpreadP;
  }

  return trade.long
    ? Math.max(trade.openPrice - liqPriceDistance, 0)
    : Math.max(trade.openPrice + liqPriceDistance, 0);
};

export const getLiqPnlThresholdP = (
  liquidationParams: LiquidationParams | undefined,
  leverage: number | undefined
): number => {
  if (
    liquidationParams === undefined ||
    leverage === undefined ||
    liquidationParams.maxLiqSpreadP === 0 ||
    liquidationParams.startLiqThresholdP === 0 ||
    liquidationParams.endLiqThresholdP === 0 ||
    liquidationParams.startLeverage === 0 ||
    liquidationParams.endLeverage === 0
  ) {
    return 0.9;
  }

  if (leverage < liquidationParams.startLeverage) {
    return liquidationParams.startLiqThresholdP;
  }

  if (leverage > liquidationParams.endLeverage) {
    return liquidationParams.endLiqThresholdP;
  }

  if (
    liquidationParams.startLiqThresholdP === liquidationParams.endLiqThresholdP
  ) {
    return liquidationParams.endLiqThresholdP;
  }

  return (
    liquidationParams.startLiqThresholdP -
    ((leverage - liquidationParams.startLeverage) *
      (liquidationParams.startLiqThresholdP -
        liquidationParams.endLiqThresholdP)) /
      (liquidationParams.endLeverage - liquidationParams.startLeverage)
  );
};
