import {
  ITradingStorage,
  IBorrowingFees,
  IPairsStorage,
} from "../contracts/types/generated/GNSMultiCollatDiamond";
import { BorrowingFee } from "./fees/borrowing";
import { FeeTier, TraderEnrollment, TraderInfo } from "./fees/tiers/types";

export type PairIndexes = {
  [key: string]: PairIndex;
};

export type TradeContainer = {
  trade: Trade;
  tradeInfo: TradeInfo;
  liquidationParams: LiquidationParams;
  initialAccFees: TradeInitialAccFees;
  receivedAt?: number;
};

export type Trade = {
  user: string;
  index: number;
  pairIndex: PairIndex;
  leverage: number; // 3 decimals
  long: boolean;
  isOpen: boolean;
  collateralIndex: number;
  tradeType: TradeType;
  collateralAmount: number;
  openPrice: number;
  sl: number;
  tp: number;
};

export type TradeInfo = {
  createdBlock: number;
  tpLastUpdatedBlock: number;
  slLastUpdatedBlock: number;
  maxSlippageP: number;
  lastOiUpdateTs: number;
  collateralPriceUsd: number;
  contractsVersion: number;
  lastPosIncreaseBlock: number;
};

export type LiquidationParams = {
  maxLiqSpreadP: number;
  startLiqThresholdP: number;
  endLiqThresholdP: number;
  startLeverage: number;
  endLeverage: number;
};

export type TradingGroup = {
  maxLeverage: number;
  minLeverage: number;
  name: string;
};

export type Fee = {
  totalPositionSizeFeeP: number;
  totalLiqCollateralFeeP: number;
  oraclePositionSizeFeeP: number;
  minPositionSizeUsd: number;
};

export type GlobalTradeFeeParams = {
  referralFeeP: number;
  govFeeP: number;
  triggerOrderFeeP: number;
  gnsOtcFeeP: number;
  gTokenFeeP: number;
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
  block: number;
  long: number;
  collateralPriceUsd: number;
  collateralIndex: number;
  date: string;
  leverage: number;
  pair: string;
  pnl_net: number;
  price: number;
  size: number;
  tx: string;
  tradeIndex: number;
  collateralDelta: number | null;
  leverageDelta: number | null;
  marketPrice: number | null;
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
  trade: ITradingStorage.TradeStruct;
  tradeInfo: ITradingStorage.TradeInfoStruct;
  liquidationParams: IPairsStorage.GroupLiquidationParamsStruct;
  initialAccFees: IBorrowingFees.BorrowingInitialAccFeesStruct;
};

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
  collateral: string;
  isActive: boolean;
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
  traderEnrollment: TraderEnrollment;
  traderInfo: TraderInfo;
  inboundPoints: number;
  outboundPoints: number;
  lastDayUpdatedPoints: number;
  expiredPoints: number[];
  unclaimedPoints: number;
};

export type PairFactor = {
  cumulativeFactor: number;
  protectionCloseFactor: number;
  protectionCloseFactorBlocks: number;
  exemptOnOpen: boolean;
  exemptAfterProtectionCloseFactor: boolean;
};

export enum PendingOrderType {
  MARKET_OPEN,
  MARKET_CLOSE,
  LIMIT_OPEN,
  STOP_OPEN,
  TP_CLOSE,
  SL_CLOSE,
  LIQ_CLOSE,
}

export enum CounterType {
  TRADE,
  PENDING_ORDER,
}

export enum TradeType {
  TRADE,
  LIMIT,
  STOP,
}

export type OpenInterest = {
  long: number;
  short: number;
  max: number;
};

export type PendingOrder = {
  trade: Trade;
  user: string;
  index: string;
  isOpen: boolean;
  orderType: PendingOrderType;
  createdBlock: string;
  maxSlippageP: string;
};

export type TradeInitialAccFees = BorrowingFee.InitialAccFees;

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
  OMNIUSD,
  PRCLUSD,
  MERLUSD,
  SAFEUSD,
  SAGAUSD,
  LLUSD,
  MSNUSD,
  REZUSD,
  NOTUSD,
  IOUSD,
  BRETTUSD,
  ATHUSD,
  ZROUSD,
  ZKUSD,
  LISTAUSD,
  BLASTUSD,
  RATSUSD,
  BNXUSD,
  PEOPLEUSD,
  TURBOUSD,
  SATSUSD,
  POPCATUSD,
  MOGUSD,
  OMUSD,
  COREUSD,
  JASMYUSD,
  DARUSD,
  MEWUSD,
  DEGENUSD,
  SLERFUSD,
  UXLINKUSD,
  AVAILUSD,
  BANANAUSD,
  RAREUSD,
  SYSUSD,
  NMRUSD,
  RSRUSD,
  SYNUSD,
  AUCTIONUSD,
  ALICEUSD,
  SUNUSD,
  TRBUSD,
  DOGSUSD,
  SSVUSD,
  PONKEUSD,
  POLUSD,
  RDNTUSD,
  FLUXUSD,
  NEIROUSD,
  SUNDOGUSD,
  CATUSD,
  BABYDOGEUSD,
  REEFUSD,
  CKBUSD,
  CATIUSD,
  LOOMUSD,
  ZETAUSD,
  HMSTRUSD,
  EIGENUSD,
  POLYXUSD,
  MOODENGUSD,
  MOTHERUSD,
  AEROUSD,
  CVCUSD,
  NEIROCTOUSD,
  ARKUSD,
  NPCUSD,
  ORBSUSD,
  APUUSD,
  BSVUSD,
  HIPPOUSD,
  GOATUSD,
  DOGUSD,
  HOTUSD,
  STORJUSD,
  RAYUSD,
  BTCDEGEN,
  PNUTUSD,
  ACTUSD,
  GRASSUSD,
  ZENUSD,
  LUMIAUSD,
  ALPHUSD,
  VIRTUALUSD,
  SPXUSD,
  ACXUSD,
  CHILLGUYUSD,
  CHEXUSD,
  BITCOINUSD,
  ETHDEGEN,
  SOLDEGEN,
}
