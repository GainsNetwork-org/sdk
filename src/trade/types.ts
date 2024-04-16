import { GFarmTradingStorageV5 } from "../contracts/types/generated";
import { IGNSTradingCallbacks } from "../contracts/types/generated/GNSTradingCallbacks";
import { BigNumber } from "ethers";
import { BorrowingFee } from "./fees/borrowing";
import { FeeTier, TraderInfo } from "./fees/tiers/types";

export type PairIndexes = {
  [key: string]: PairIndex;
};

export type TradeContainer = {
  trade: Trade;
  tradeInfo: TradeInfo;
  initialAccFees: TradeInitialAccFees;
  tradeData: TradeData;
  receivedAt?: number;
};

export type Trade = {
  buy: boolean;
  index: number;
  initialPosToken: number;
  leverage: number;
  openPrice: number;
  pairIndex: PairIndex;
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
  borrowing: BorrowingFee.InitialAccFees;
};

export type TradeData = {
  maxSlippageP: number;
  lastOiUpdateTs: number;
  collateralPriceUsd: number;
};

export type TradingGroup = {
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
  pairIndex: PairIndex;
  positionSize: number;
  sl: number;
  spreadReductionP: number;
  tp: number;
  trader: string;
  type: number;
  maxSlippageP: number;
};

export type LimitOrderRaw = GFarmTradingStorageV5.OpenLimitOrderStructOutput & {
  type: number;
  maxSlippageP: BigNumber;
};

export type Fee = {
  closeFeeP: number;
  minLevPosUsd: number;
  nftLimitOrderFeeP: number;
  openFeeP: number;
};

export type OpenInterest = {
  long: number;
  max: number;
  short: number;
};

export type PairDepth = {
  onePercentDepthAboveUsd: number;
  onePercentDepthBelowUsd: number;
};

export type PairParamsBorrowingFees = {
  pairs: BorrowingFee.Pair[];
  groups: BorrowingFee.Group[];
};

export type Pair = {
  name: string;
  description: string;
  from: string;
  to: string;
  feeIndex: number;
  groupIndex: number;
  pairIndex: PairIndex;
  spreadP: number;
};

export type TradeHistoryRecord = {
  action: string;
  address: string;
  buy: number;
  collateralPriceUsd: number;
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
  pairIndex: PairIndex;
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
  totalPnlUsd: number;
};

export type OpenTradeParams = [
  address: string,
  pairIndex: PairIndex,
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

export type TradeContainerRaw = {
  trade: GFarmTradingStorageV5.TradeStruct;
  tradeInfo: GFarmTradingStorageV5.TradeInfoStruct;
  tradeData: IGNSTradingCallbacks.TradeDataStruct;
  initialAccFees: {
    borrowing: {
      accPairFee: number;
      accGroupFee: number;
      block: number;
    };
  };
};

export enum OpenLimitOrderType {
  LEGACY = 0,
  REVERSAL = 1,
  MOMENTUM = 2,
}

export type OiWindowsSettings = {
  startTs: number;
  windowsDuration: number;
  windowsCount: number;
};

export type PairOi = {
  oiLongUsd: number;
  oiShortUsd: number;
};

export type OiWindow = PairOi;

export type OiWindows = {
  [key: string]: OiWindow;
};

export type CollateralConfig = {
  precision: number;
  precisionDelta: number;
  decimals?: number;
};

export type FeeTiers = {
  tiers: FeeTier[];
  multipliers: number[];
  currentDay: number;
};

export type TraderFeeTiers = {
  traderInfo: TraderInfo;
  inboundPoints: number;
  outboundPoints: number;
  lastDayUpdatedPoints: number;
  expiredPoints: number[];
};

export enum PairIndex {
  BTCUSD,
  ETHUSD,
  LINKUSD,
  DOGEUSD,
  MATICUSD,
  ADAUSD,
  SUSHIUSD,
  AAVEUSD,
  ALGOUSD,
  BATUSD,
  COMPUSD,
  DOTUSD,
  EOSUSD,
  LTCUSD,
  MANAUSD,
  OMGUSD,
  SNXUSD,
  UNIUSD,
  XLMUSD,
  XRPUSD,
  ZECUSD,
  EURUSD,
  USDJPY,
  GBPUSD,
  USDCHF,
  AUDUSD,
  USDCAD,
  NZDUSD,
  EURCHF,
  EURJPY,
  EURGBP,
  LUNAUSD,
  YFIUSD,
  SOLUSD,
  XTZUSD,
  BCHUSD,
  BNTUSD,
  CRVUSD,
  DASHUSD,
  ETCUSD,
  ICPUSD,
  MKRUSD,
  NEOUSD,
  THETAUSD,
  TRXUSD,
  ZRXUSD,
  SANDUSD,
  BNBUSD,
  AXSUSD,
  GRTUSD,
  HBARUSD,
  XMRUSD,
  ENJUSD,
  FTMUSD,
  FTTUSD,
  APEUSD,
  CHZUSD,
  SHIBUSD,
  AAPLUSD,
  FBUSD,
  GOOGLUSD,
  AMZNUSD,
  MSFTUSD,
  TSLAUSD,
  SNAPUSD,
  NVDAUSD,
  VUSD,
  MAUSD,
  PFEUSD,
  KOUSD,
  DISUSD,
  GMEUSD,
  NKEUSD,
  AMDUSD,
  PYPLUSD,
  ABNBUSD,
  BAUSD,
  SBUXUSD,
  WMTUSD,
  INTCUSD,
  MCDUSD,
  METAUSD,
  GOOGLUSD2,
  GMEUSD2,
  AMZNUSD2,
  TSLAUSD2,
  SPYUSD,
  QQQUSD,
  IWMUSD,
  DIAUSD,
  XAUUSD,
  XAGUSD,
  USDCNH,
  USDSGD,
  EURSEK,
  USDKRW,
  EURNOK,
  USDINR,
  USDMXN,
  USDTWD,
  USDZAR,
  USDBRL,
  AVAXUSD,
  ATOMUSD,
  NEARUSD,
  QNTUSD,
  IOTAUSD,
  TONUSD,
  RPLUSD,
  ARBUSD,
  EURAUD,
  EURNZD,
  EURCAD,
  GBPAUD,
  GBPNZD,
  GBPCAD,
  GBPCHF,
  GBPJPY,
  AUDNZD,
  AUDCAD,
  AUDCHF,
  AUDJPY,
  NZDCAD,
  NZDCHF,
  NZDJPY,
  CADCHF,
  CADJPY,
  CHFJPY,
  LDOUSD,
  INJUSD,
  RUNEUSD,
  CAKEUSD,
  FXSUSD,
  TWTUSD,
  PEPEUSD,
  DYDXUSD,
  GMXUSD,
  FILUSD,
  APTUSD,
  IMXUSD,
  VETUSD,
  OPUSD,
  RNDRUSD,
  EGLDUSD,
  TIAUSD,
  STXUSD,
  FLOWUSD,
  KAVAUSD,
  GALAUSD,
  MINAUSD,
  ORDIUSD,
  ILVUSD,
  KLAYUSD,
  SUIUSD,
  BLURUSD,
  FETUSD,
  CFXUSD,
  BEAMUSD,
  ARUSD,
  SEIUSD,
  BTTUSD,
  ROSEUSD,
  WOOUSD,
  AGIXUSD,
  ZILUSD,
  GMTUSD,
  ASTRUSD,
  ONEINCHUSD,
  FLOKIUSD,
  QTUMUSD,
  OCEANUSD,
  WLDUSD,
  MASKUSD,
  CELOUSD,
  LRCUSD,
  ENSUSD,
  MEMEUSD,
  ANKRUSD,
  IOTXUSD,
  ICXUSD,
  KSMUSD,
  RVNUSD,
  ANTUSD,
  WAVESUSD,
  SKLUSD,
  SUPERUSD,
  BALUSD,
  WTIUSD,
  XPTUSD,
  XPDUSD,
  HGUSD,
  JUPUSD,
  MANTAUSD,
  BONKUSD,
  PENDLEUSD,
  OSMOUSD,
  ALTUSD,
  UMAUSD,
  MAGICUSD,
  API3USD,
  STRKUSD,
  DYMUSD,
  NTRNUSD,
  PYTHUSD,
  SCUSD,
  WIFUSD,
  PIXELUSD,
  JTOUSD,
  MAVIAUSD,
  MYROUSD,
  STGUSD,
  BOMEUSD,
  ETHFIUSD,
  METISUSD,
  AEVOUSD,
  ONDOUSD,
  MNTUSD,
  KASUSD,
  RONINUSD,
  ENAUSD,
  WUSD,
  ZEUSUSD,
  TNSRUSD,
  TAOUSD,
}
