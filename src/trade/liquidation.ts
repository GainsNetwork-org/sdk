import { getBorrowingFee, GetBorrowingFeeContext } from "./fees";
import { Trade, TradeInfo, TradeInitialAccFees } from "./types";

export type GetLiqPriceContext = GetBorrowingFeeContext & {
  currentBlock: number;
  currentL1Block: number;
};

export const getLiquidationPrice = (
  trade: Trade,
  tradeInfo: TradeInfo,
  initialAccFees: TradeInitialAccFees,
  context: GetLiqPriceContext
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
          context as GetBorrowingFeeContext
        ))) /
    posDai /
    trade.leverage;

  return trade.buy
    ? Math.max(trade.openPrice - liqPriceDistance, 0)
    : Math.max(trade.openPrice + liqPriceDistance, 0);
};
