import { getBorrowingFee, GetBorrowingFeeContext } from "./fees";
import { Trade, TradeInfo, TradeInitialAccFees } from "./types";

export const getLiquidationPrice = (
  trade: Trade,
  tradeInfo: TradeInfo,
  initialAccFees: TradeInitialAccFees,
  context: GetBorrowingFeeContext
): number => {
  const posDai = trade.initialPosToken * tradeInfo.tokenPriceDai;

  const liqPriceDistance =
    (trade.openPrice *
      (posDai * 0.9 -
        getBorrowingFee(
          posDai * trade.leverage,
          trade.pairIndex,
          trade.buy,
          initialAccFees.borrowing,
          context
        ))) /
    posDai /
    trade.leverage;

  return trade.buy
    ? Math.max(trade.openPrice - liqPriceDistance, 0)
    : Math.max(trade.openPrice + liqPriceDistance, 0);
};
