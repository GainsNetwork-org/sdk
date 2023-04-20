import {
  getFundingFee,
  GetFundingFeeContext,
  getRolloverFee,
  GetRolloverFeeContext,
  getBorrowingFee,
  GetBorrowingFeeContext,
} from "./fees";
import { Trade, TradeInfo, TradeInitialAccFees } from "./types";

export type GetLiqPriceContext = GetFundingFeeContext &
  GetRolloverFeeContext &
  GetBorrowingFeeContext;

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
        getRolloverFee(
          posDai,
          initialAccFees.rollover,
          initialAccFees.openedAfterUpdate,
          context as GetRolloverFeeContext
        ) -
        -getBorrowingFee(
          posDai,
          trade.pairIndex,
          trade.buy,
          initialAccFees.borrowing,
          context as GetBorrowingFeeContext
        ),
      getFundingFee(
        posDai * trade.leverage,
        initialAccFees.funding,
        trade.buy,
        initialAccFees.openedAfterUpdate,
        context as GetFundingFeeContext
      ))) /
    posDai /
    trade.leverage;

  return trade.buy
    ? trade.openPrice - liqPriceDistance
    : trade.openPrice + liqPriceDistance;
};
