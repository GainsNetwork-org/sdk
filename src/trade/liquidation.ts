import {
  getBorrowingFee,
  GetBorrowingFeeContext,
  BorrowingFee,
  getClosingFee,
} from "./fees";
import { Fee, Trade } from "./types";

export const getLiquidationPrice = (
  trade: Trade,
  fee: Fee,
  initialAccFees: BorrowingFee.InitialAccFees,
  context: GetBorrowingFeeContext
): number => {
  const closingFee = getClosingFee(
    trade.collateralAmount,
    trade.leverage,
    trade.pairIndex,
    fee
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
