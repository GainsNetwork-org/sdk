import { CollateralConfig } from "src/markets/collateral";
import {
  BorrowingFee,
  BorrowingFeeV2,
  CounterTradeSettings,
  Fee,
  FeeTiers,
  FundingFees,
  GlobalTradeFeeParams,
  LeaderboardTrader,
  LiquidationParams,
  OiWindows,
  OiWindowsSettings,
  Pair,
  PairFactor,
  PairIndexes,
  TradingGroup,
} from "../../trade";
import {
  PairDepthBands,
  DepthBandsMapping,
} from "../../trade/priceImpact/cumulVol/types";
import { UnifiedPairOi } from "src/markets";

export type TransformedGlobalTradingVariables = {
  globalTradingVariables: GlobalTradingVariablesType;
  pairIndexes: PairIndexes;
  blockNumber: number | undefined;
  l1BlockNumber: number | undefined;
};

/**
 * @dev Processed collateral data from backend (wrapper of contract data)
 */
export type TradingVariablesCollateral = {
  pairBorrowingFees: BorrowingFee.Pair[];
  groupBorrowingFees: BorrowingFee.Group[];
  pairBorrowingFeesV2: {
    params: BorrowingFeeV2.BorrowingFeeParams[];
    data: BorrowingFeeV2.PairBorrowingFeeData[];
  };
  pairFundingFees: {
    globalParams: FundingFees.PairGlobalParams[];
    params: FundingFees.FundingFeeParams[];
    data: FundingFees.PairFundingFeeData[];
  };
  collateral: string;
  collateralIndex: number;
  collateralConfig: CollateralConfig;
  gToken: {
    address: string;
    currentBalanceCollateral: string;
    marketCap: string;
    maxBalanceCollateral: string;
  };
  tradingPairs?: Map<number, Pair>;
  isActive: boolean;
  prices: TokenPrices;
  symbol: string;
  pairOis: UnifiedPairOi[];
  pairSkewDepths: { [pairIndex: number]: number }; // Skew depth in tokens
};

export type TokenPrices = {
  collateralPriceUsd: number;
  gnsPriceCollateral: number;
  gnsPriceUsd: number;
};

export type GlobalTradingVariablesType = {
  collaterals: TradingVariablesCollateral[];
  paused?: boolean;
  pairs?: Pair[];
  stockPairToActiveStockSplit?: Map<string, string>;
  groups?: TradingGroup[];
  fees?: Fee[];
  orderTimeout?: number;
  crypto?: string[];
  forex?: string[];
  forexClosed?: boolean;
  stocks?: string[];
  stocksClosed?: boolean;
  indices?: string[];
  indicesClosed?: boolean;
  commodities?: string[];
  commoditiesClosed?: boolean;
  blockConfirmations?: number;
  pairDepthBands?: PairDepthBands[];
  depthBandsMapping?: DepthBandsMapping;
  pairMaxLeverages?: number[];
  maxNegativePnlOnOpenP?: number;
  oiWindowsSettings?: OiWindowsSettings;
  oiWindows?: OiWindows[];
  collateralConfig?: CollateralConfig;
  feeTiers?: FeeTiers;
  liquidationParams: {
    groups: LiquidationParams[];
    pairs: LiquidationParams[];
  };
  counterTradeSettings: CounterTradeSettings[];
  pairFactors: PairFactor[];
  globalTradeFeeParams?: GlobalTradeFeeParams;
  congestionLevels: {
    low: number;
    high: number;
  };
};

export interface LeaderboardTraderWithWinsLosses extends LeaderboardTrader {
  wins?: number;
  losses?: number;
}

export interface ILeaderboard {
  ready: boolean;
  bestTraders: LeaderboardTraderWithWinsLosses[];
}

export enum ORDER_TYPE {
  LIMIT = "LIMIT",
  STOP = "STOP",
  MARKET = "MARKET",
}

export enum TRADE_TYPE {
  LONG = "LONG",
  SHORT = "SHORT",
}

export interface ActiveNews {
  desc: string;
  from: number;
  to: number;
}

export interface BorrowingFeePerBlock {
  pairFee: number;
  minPairFee: number;
  groupFee: number;
  pairLong: boolean;
  groupLong: boolean;
}
