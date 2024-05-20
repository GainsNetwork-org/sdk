import { getBorrowingFee, GetBorrowingFeeContext, BorrowingFee } from "./fees";
import { Trade, TradeInfo } from "./types";

export const getLiquidationPrice = (
  trade: Trade,
  tradeInfo: TradeInfo,
  initialAccFees: BorrowingFee.InitialAccFees,
  context: GetBorrowingFeeContext
): number => {
  const liqPriceDistance =
    (trade.openPrice *
      (trade.collateralAmount * 0.9 -
        getBorrowingFee(
          trade.collateralAmount * trade.leverage,
          trade.pairIndex,
          trade.long,
          initialAccFees,
          context
        ))) /
    trade.collateralAmount /
    trade.leverage;

  return trade.long
    ? Math.max(trade.openPrice - liqPriceDistance, 0)
    : Math.max(trade.openPrice + liqPriceDistance, 0);
};
