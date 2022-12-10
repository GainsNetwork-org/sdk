export type PairIndexes = {
  [key: string]: number;
};

export type TradeContainer = {
  trade: Trade;
  tradeInfo: TradeInfo;
  initialAccFees: TradeInitialAccFees;
};

export type Trade = {
  buy: boolean;
  index: number;
  initialPosToken: number;
  leverage: number;
  openPrice: number;
  pairIndex: number;
  sl: number;
  tp: number;
  trader: string;
};

export type TradeInfo = {
  openInterestDai: number;
  slLastUpdated: number;
  tokenPriceDai: number;
  tpLastUpdated: number;
};

export type TradeInitialAccFees = {
  rollover: number;
  funding: number;
  openedAfterUpdate: boolean;
};

export type TradingGroup = {
  maxCollateralP: number;
  maxLeverage: number;
  minLeverage: number;
  name: string;
};

export type LimitOrder = {
  block: number;
  buy: boolean;
  index: number;
  leverage: number;
  maxPrice: number;
  minPrice: number;
  pairIndex: number;
  positionSize: number;
  sl: number;
  spreadReductionP: number;
  tp: number;
  trader: string;
  type: number;
};

export type Fee = {
  closeFeeP: number;
  minLevPosDai: number;
  nftLimitOrderFeeP: number;
  openFeeP: number;
  referralFeeP: number;
};

export type OpenInterest = {
  long: number;
  max: number;
  short: number;
};

export type OpenCollateral = {
  long: number;
  short: number;
};

export type PairParams = {
  onePercentDepthAbove: number;
  onePercentDepthBelow: number;
  rolloverFeePerBlockP: number;
  fundingFeePerBlockP: number;
};

export type PairRolloverFees = {
  accPerCollateral: number;
  lastUpdateBlock: number;
};

export type PairFundingFees = {
  accPerOiLong: number;
  accPerOiShort: number;
  lastUpdateBlock: number;
};

export type Pair = {
  name: string;
  from: string;
  to: string;
  feeIndex: number;
  groupIndex: number;
  pairIndex: number;
  spreadP: number;
};

export type TradeHistoryRecord = {
  action: string;
  address: string;
  buy: number;
  date: string;
  leverage: number;
  pair: string;
  pnl_net: number;
  price: number;
  size: number;
  tx: string;
};

export type MarketOrder = {
  trader: string;
  pairIndex: number;
  index: number;
  block: number;
  open: boolean;
};

export type ChartBar = {
  close: number;
  high: number;
  isBarClosed: boolean;
  isLastBar: boolean;
  low: number;
  open: number;
  time: number;
};

export type LeaderboardTrader = {
  address: string;
  tradesCount: number;
  winrate: number;
  pnl: number;
  volume: number;
  score: number;
};

export type OpenTradeParams = [
  address: string,
  pairIndex: number,
  x1: number,
  x2: number,
  wei: number,
  price: string,
  buy: boolean,
  leverage: number,
  takeProfit: string,
  stopLoss: string
];

export enum PositionType {
  LONG = "LONG",
  SHORT = "SHORT",
}
