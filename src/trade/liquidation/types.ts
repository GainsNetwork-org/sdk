import { GetBorrowingFeeContext, BorrowingFee } from "./../fees";
import {
  LiquidationParams,
  UserPriceImpact,
  TradeFeesData,
  TradeInfo,
  Fee,
  CounterTradeSettings,
} from "./../types";
import { ContractsVersion } from "../../contracts/types";
import { GetPairBorrowingFeeV2Context } from "../fees/borrowingV2";
import { GetPairFundingFeeContext } from "../fees/fundingFees";
import { TradingFeesSubContext } from "../fees/trading/builder";

/**
 * @dev Structured context for liquidation price calculations
 * @dev Follows the same pattern as GetComprehensivePnlContext
 */
export type GetLiquidationPriceContext = {
  // Core shared context
  core: {
    currentBlock: number;
    currentTimestamp: number;
    collateralPriceUsd: number;
    contractsVersion: ContractsVersion;
    spreadP: number; // Pair spread percentage
  };

  // Fee contexts using canonical types
  borrowingV1?: GetBorrowingFeeContext;
  borrowingV2?: GetPairBorrowingFeeV2Context;
  funding?: GetPairFundingFeeContext;

  // Trading fees context
  trading: TradingFeesSubContext;

  // Trade-specific data
  tradeData: {
    tradeInfo: TradeInfo;
    tradeFeesData: TradeFeesData; // Required for opened trades
    liquidationParams: LiquidationParams;
    initialAccFees?: BorrowingFee.InitialAccFees; // For V1 borrowing fees
  };

  // Additional parameters specific to liquidation calculation
  liquidationSpecific: {
    currentPairPrice: number;
    additionalFeeCollateral: number; // Additional fees to include (e.g., opening fees for increases)
    partialCloseMultiplier: number;
    beforeOpened: boolean;
    isCounterTrade: boolean;
    userPriceImpact?: UserPriceImpact;
    newOpenPrice?: number; // For position increases (weighted average open price)
  };
};
