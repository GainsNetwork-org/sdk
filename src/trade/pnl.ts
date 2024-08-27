import { getBorrowingFee, GetBorrowingFeeContext, getClosingFee } from "./fees";
import {
  Fee,
  LiquidationParams,
  Trade,
  TradeInfo,
  TradeInitialAccFees,
} from "./types";
import { getLiqPnlThresholdP } from "./liquidation";
import { ContractsVersion } from "../contracts/types";

export type GetPnlContext = GetBorrowingFeeContext & {
  fee: Fee | undefined;
  maxGainP: number | undefined;
  collateralPriceUsd: number | undefined;
  contractsVersion: ContractsVersion | undefined;
  feeMultiplier: number | undefined;
};

export const getPnl = (
  price: number | undefined,
  trade: Trade,
  tradeInfo: TradeInfo,
  initialAccFees: TradeInitialAccFees,
  liquidationParams: LiquidationParams,
  useFees: boolean,
  context: GetPnlContext
): number[] | undefined => {
  if (!price) {
    return;
  }
  const posCollat = trade.collateralAmount;
  const { openPrice, leverage } = trade;
  const { maxGainP, fee } = context;
  const maxGain =
    maxGainP === undefined ? Infinity : (maxGainP / 100) * posCollat;

  let pnlCollat = trade.long
    ? ((price - openPrice) / openPrice) * leverage * posCollat
    : ((openPrice - price) / openPrice) * leverage * posCollat;

  pnlCollat = pnlCollat > maxGain ? maxGain : pnlCollat;

  if (useFees) {
    pnlCollat -= getBorrowingFee(
      posCollat * trade.leverage,
      trade.pairIndex,
      trade.long,
      initialAccFees,
      context as GetBorrowingFeeContext
    );
  }

  let pnlPercentage = (pnlCollat / posCollat) * 100;

  // Can be liquidated
  if (
    pnlPercentage <=
    getLiqPnlThresholdP(liquidationParams, leverage) * -100
  ) {
    pnlPercentage = -100;
  } else {
    pnlCollat -= getClosingFee(
      posCollat,
      trade.leverage,
      trade.pairIndex,
      fee,
      context.collateralPriceUsd,
      context.feeMultiplier
    );
    pnlPercentage = (pnlCollat / posCollat) * 100;
  }

  pnlPercentage = pnlPercentage < -100 ? -100 : pnlPercentage;
  pnlCollat = (posCollat * pnlPercentage) / 100;

  return [pnlCollat, pnlPercentage];
};
