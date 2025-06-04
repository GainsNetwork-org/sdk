import { getBorrowingFee, GetBorrowingFeeContext } from "./fees";
import {
  getTotalTradeFeesCollateral,
  GetTradeFeesContext,
} from "./fees/trading";
import {
  LiquidationParams,
  Trade,
  TradeInfo,
  TradeInitialAccFees,
} from "./types";
import { getLiqPnlThresholdP } from "./liquidation";
import { ContractsVersion } from "../contracts/types";

export type GetPnlContext = GetBorrowingFeeContext &
  GetTradeFeesContext & {
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

  let pnlCollat = trade.long
    ? ((price - openPrice) / openPrice) * leverage * posCollat
    : ((openPrice - price) / openPrice) * leverage * posCollat;

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
    // Calculate closing fee using the same function as opening fees
    const positionSizeCollateral = posCollat * trade.leverage;
    const closingFee = getTotalTradeFeesCollateral(
      0, // collateralIndex not used
      trade.user,
      trade.pairIndex,
      positionSizeCollateral,
      trade.isCounterTrade ?? false,
      context
    );
    pnlCollat -= closingFee;
    pnlPercentage = (pnlCollat / posCollat) * 100;
  }

  pnlPercentage = pnlPercentage < -100 ? -100 : pnlPercentage;
  pnlCollat = (posCollat * pnlPercentage) / 100;

  return [pnlCollat, pnlPercentage];
};
