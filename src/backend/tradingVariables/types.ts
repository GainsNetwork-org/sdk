import { CollateralConfig } from "src/markets/collateral";
import { BorrowingFee, BorrowingFeeV2, FundingFees, Pair } from "../../trade";
import { UnifiedPairOi } from "src/markets";

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
};

// Orphaned types
export type TokenPrices = {
  collateralPriceUsd: number;
  gnsPriceCollateral: number;
  gnsPriceUsd: number;
};
