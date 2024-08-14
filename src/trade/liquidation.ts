import {
  getBorrowingFee,
  GetBorrowingFeeContext,
  BorrowingFee,
  getClosingFee,
} from "./fees";
import { Fee, Trade } from "./types";

export type GetLiquidationPriceContext = GetBorrowingFeeContext & {
  collateralPriceUsd: number | undefined;
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
  const liqPriceDistance =
    (trade.openPrice *
      (trade.collateralAmount * 0.9 - (borrowingFee + closingFee))) /
    trade.collateralAmount /
    trade.leverage;

  return trade.long
    ? Math.max(trade.openPrice - liqPriceDistance, 0)
    : Math.max(trade.openPrice + liqPriceDistance, 0);
};
