import {
  getBorrowingFee,
  GetBorrowingFeeContext,
  getClosingFee,
  getFundingFee,
  GetFundingFeeContext,
  getRolloverFee,
  GetRolloverFeeContext,
} from "./fees";
import { Fee, Trade, TradeInfo, TradeInitialAccFees } from "./types";

export type GetPnlContext = GetRolloverFeeContext &
  GetFundingFeeContext &
  GetBorrowingFeeContext & {
    currentBlock: number;
    currentL1Block: number;
    fee: Fee | undefined;
    maxGainP: number | undefined;
  };

export const getPnl = (
  price: number | undefined,
  trade: Trade,
  tradeInfo: TradeInfo,
  initialAccFees: TradeInitialAccFees,
  useFees: boolean,
  context: GetPnlContext
): number[] | undefined => {
  if (!price) {
    return;
  }
  const posDai = trade.initialPosToken * tradeInfo.tokenPriceDai;
  const { openPrice, leverage } = trade;
  const {
    maxGainP,
    pairParams,
    pairRolloverFees,
    pairFundingFees,
    openInterest,
    fee,
    currentL1Block,
  } = context;
  const maxGain = maxGainP === undefined ? Infinity : (maxGainP / 100) * posDai;

  let pnlDai = trade.buy
    ? ((price - openPrice) / openPrice) * leverage * posDai
    : ((openPrice - price) / openPrice) * leverage * posDai;

  pnlDai = pnlDai > maxGain ? maxGain : pnlDai;

  if (useFees) {
    pnlDai -= getRolloverFee(
      posDai,
      initialAccFees.rollover,
      initialAccFees.openedAfterUpdate,
      {
        currentBlock: currentL1Block,
        pairParams,
        pairRolloverFees,
      }
    );

    pnlDai -= getFundingFee(
      posDai * trade.leverage,
      initialAccFees.funding,
      trade.buy,
      initialAccFees.openedAfterUpdate,
      {
        currentBlock: currentL1Block,
        pairParams,
        pairFundingFees,
        openInterest,
      }
    );

    pnlDai -= getBorrowingFee(
      posDai,
      trade.pairIndex,
      trade.buy,
      initialAccFees.borrowing,
      context as GetBorrowingFeeContext
    );
  }

  let pnlPercentage = (pnlDai / posDai) * 100;

  // Can be liquidated
  if (pnlPercentage <= -90) {
    pnlPercentage = -100;
  } else {
    pnlDai -= getClosingFee(posDai, trade.leverage, trade.pairIndex, fee);
    pnlPercentage = (pnlDai / posDai) * 100;
  }

  pnlPercentage = pnlPercentage < -100 ? -100 : pnlPercentage;
  pnlDai = (posDai * pnlPercentage) / 100;

  return [pnlDai, pnlPercentage];
};
