import { TokenPrices } from "./types";

export interface TradeContainerBackend {
  trade: TradeBackend;
  tradeInfo: TradeInfoBackend;
  initialAccFees: TradeInitialAccFeesBackend;
  liquidationParams: LiquidationParamsBackend;
  tradeFeesData?: TradeFeesDataBackend;
  uiRealizedPnlData?: UiRealizedPnlDataBackend;
}

export interface TradeBackend {
  user: string;
  index: string;
  pairIndex: string;
  leverage: string;
  long: boolean;
  isOpen: boolean;
  collateralIndex: string;
  tradeType: string;
  collateralAmount: string;
  openPrice: string;
  tp: string;
  sl: string;
  isCounterTrade?: boolean;
  positionSizeToken?: string;
}

export interface TradeInfoBackend {
  createdBlock: string;
  tpLastUpdatedBlock: string;
  slLastUpdatedBlock: string;
  maxSlippageP: string;
  lastOiUpdateTs: number;
  collateralPriceUsd: string;
  contractsVersion: string;
  lastPosIncreaseBlock: string;
}

export interface TradeInitialAccFeesBackend {
  accPairFee: string;
  accGroupFee: string;
  block: string;
}

export interface TradeFeesDataBackend {
  realizedTradingFeesCollateral: string;
  realizedPnlCollateral: string;
  manuallyRealizedNegativePnlCollateral: string;
  alreadyTransferredNegativePnlCollateral: string;
  virtualAvailableCollateralInDiamond: string;
  initialAccFundingFeeP: string;
  initialAccBorrowingFeeP: string;
}

export interface UiRealizedPnlDataBackend {
  realizedTradingFeesCollateral: string;
  realizedOldBorrowingFeesCollateral: string;
  realizedNewBorrowingFeesCollateral: string;
  realizedFundingFeesCollateral: string;
  realizedPnlPartialCloseCollateral: string;
  pnlWithdrawnCollateral: string;
}

export interface LiquidationParamsBackend {
  maxLiqSpreadP: string;
  startLiqThresholdP: string;
  endLiqThresholdP: string;
  startLeverage: string;
  endLeverage: string;
}

export interface TradingGroupBackend {
  name: string;
  minLeverage: string;
  maxLeverage: string;
}

export interface FeeBackend {
  totalPositionSizeFeeP: string;
  totalLiqCollateralFeeP: string;
  oraclePositionSizeFeeP: string;
  minPositionSizeUsd: string;
}

export interface OpenInterestBeforeV10Backend {
  long: string;
  short: string;
  max: string;
}

export interface OpenInterestCollateralBackend {
  oiLongCollateral: string;
  oiShortCollateral: string;
}

export interface OpenInterestTokenBackend {
  oiLongToken: string;
  oiShortToken: string;
}

export interface OpenInterestBackend {
  beforeV10: OpenInterestBeforeV10Backend;
  collateral: OpenInterestCollateralBackend;
  token: OpenInterestTokenBackend;
}

export interface GroupOpenInterestBackend {
  long: string;
  short: string;
  max: string;
}

export interface PairDepthBackend {
  onePercentDepthAboveUsd: string;
  onePercentDepthBelowUsd: string;
}

export interface PairBorrowingFeesBackendPairGroup {
  groupIndex: string;
  block: string;
  initialAccFeeLong: string;
  initialAccFeeShort: string;
  prevGroupAccFeeLong: string;
  prevGroupAccFeeShort: string;
  pairAccFeeLong: string;
  pairAccFeeShort: string;
}

export interface PairBorrowingFeesBackendPair {
  oi: OpenInterestBackend;
  feePerBlock: string;
  accFeeLong: string;
  accFeeShort: string;
  accLastUpdatedBlock: string;
  feeExponent: string;
  groups: PairBorrowingFeesBackendPairGroup[];
  feePerBlockCap?: BorrowingFeePerBlockCapBackend;
}

export interface PairBorrowingFeesBackendGroup {
  oi: GroupOpenInterestBackend;
  feePerBlock: string;
  accFeeLong: string;
  accFeeShort: string;
  accLastUpdatedBlock: string;
  feeExponent: string;
}

export interface BorrowingFeePerBlockCapBackend {
  minP: string;
  maxP: string;
}

export interface PairParamsBorrowingFeesBackend {
  pairs: PairBorrowingFeesBackendPair[];
  groups: PairBorrowingFeesBackendGroup[];
}

export interface PairBackend {
  from: string;
  to: string;
  spreadP: string;
  groupIndex: string;
  feeIndex: string;
}

export type PairFactorBackend = {
  cumulativeFactor: string;
  protectionCloseFactor: string;
  protectionCloseFactorBlocks: string;
  exemptOnOpen: boolean;
  exemptAfterProtectionCloseFactor: boolean;
};

export interface GlobalTradingVariablesBackend {
  lastRefreshed: string;
  refreshId: number;
  tradingState: number;
  marketOrdersTimeoutBlocks: number;
  pairs: PairBackend[];
  groups: TradingGroupBackend[];
  fees: FeeBackend[];
  pairInfos: PairInfosBackend;
  collaterals: CollateralBackend[];
  sssTokenBalance: string;
  sssLegacyTokenBalance: string;
  sssRewardTokens: string[];
  vaultClosingFeeP: string;
  maxNegativePnlOnOpenP: number;
  blockConfirmations: number;
  oiWindowsSettings: OiWindowsSettingsBackend;
  oiWindows: OiWindowsBackend[];
  feeTiers: FeeTiersBackend;
  allTrades: TradeContainerBackend[];
  currentBlock: number;
  currentL1Block: number;
  isForexOpen: boolean;
  isStocksOpen: boolean;
  isIndicesOpen: boolean;
  isCommoditiesOpen: boolean;
  liquidationParams: {
    groups: LiquidationParamsBackend[];
    pairs: LiquidationParamsBackend[];
  };
  counterTradeSettings: CounterTradeSettingsBackend[];
  globalTradeFeeParams: GlobalTradeFeeParamsBackend;
  negPnlCumulVolMultiplier: string;
  congestionLevels: {
    low: number;
    high: number;
  };
}

export interface FundingFeesBackend {
  pairGlobalParams: { maxSkewCollateral: string }[];
  pairParams: {
    skewCoefficientPerYear: string;
    absoluteVelocityPerYearCap: string;
    absoluteRatePerSecondCap: string;
    thetaThresholdUsd: string;
    fundingFeesEnabled: boolean;
    aprMultiplierEnabled: boolean;
  }[];
  pairData: {
    accFundingFeeLongP: string;
    accFundingFeeShortP: string;
    lastFundingRatePerSecondP: string;
    lastFundingUpdateTs: string;
  }[];
}

export interface BorrowingFeesV2Backend {
  pairParams: { borrowingRatePerSecondP: string }[];
  pairData: { accBorrowingFeeP: string; lastBorrowingUpdateTs: string }[];
}

export interface CollateralBackend {
  collateralIndex: number;
  collateral: string;
  symbol: string;
  isActive: boolean;
  prices: TokenPrices;
  collateralConfig: CollateralConfigBackend;
  gToken: {
    address: string;
    currentBalanceCollateral: string;
    maxBalanceCollateral: string;
    marketCap: string;
  };
  borrowingFees: {
    v1: PairParamsBorrowingFeesBackend;
    v2: BorrowingFeesV2Backend;
  };
  fundingFees: FundingFeesBackend;
  pairOis: OpenInterestBackend[];
  pairSkewDepths?: string[];
}

export interface PairInfosBackend {
  maxLeverages: string[];
  pairDepths: PairDepthBackend[];
  pairFactors: PairFactorBackend[];
}

export type TraderInfoBackend = {
  lastDayUpdated: number;
  trailingPoints: string;
};

export type TraderEnrollmentBackend = {
  status: number;
};

export type TraderFeeTiersBackend = {
  traderEnrollment: TraderEnrollmentBackend;
  traderInfo: TraderInfoBackend;
  lastDayUpdatedPoints: string;
  inboundPoints: string;
  outboundPoints: string;
  expiredPoints: string[];
  unclaimedPoints: string;
};

export interface UserTradingVariablesBackend {
  pendingMarketOrdersIds: any[];
  pendingMarketOrders: any[];
  feeTiers: TraderFeeTiersBackend;
  collaterals: Array<{ balance: string; allowance: string; decimals: number }>;
  protectionCloseFactorWhitelist: boolean;
  userPriceImpact: Array<{
    cumulVolPriceImpactMultiplier: string;
    fixedSpreadP: string;
  }>;
}

export type OpenTradeInfo = {
  tradeId: string;
  timestamp: number;
};

export type OpenTradeInfoMap = {
  [key: string]: OpenTradeInfo;
};

export type PairOiBackend = {
  oiLongUsd: string;
  oiShortUsd: string;
};

export type OiWindowsBackend = {
  [key: string]: PairOiBackend;
};

export type OiWindowsSettingsBackend = {
  startTs: number;
  windowsDuration: number;
  windowsCount: number;
};

export type CollateralConfigBackend = {
  precision: string;
  precisionDelta: string;
  decimals: number;
};

export type FeeTiersBackend = {
  tiers: Array<{ feeMultiplier: string; pointsThreshold: string }>; // 1e3, 1
  multipliers: string[]; // 1e3
  currentDay: number;
};

export type GlobalTradeFeeParamsBackend = {
  referralFeeP: string;
  govFeeP: string;
  triggerOrderFeeP: string;
  gnsOtcFeeP: string;
  gTokenFeeP: string;
};

export type CounterTradeSettingsBackend = {
  maxLeverage: string;
  feeRateMultiplier: string;
};
