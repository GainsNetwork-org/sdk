import { GetBorrowingFeeContext, BorrowingFee } from "./../fees";
import {
  LiquidationParams,
  UserPriceImpact,
  TradeFeesData,
  TradeInfo,
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
  trading: TradingFeesSubContext & {
    userPriceImpact?: UserPriceImpact;
  };

  // Trade-specific data
  tradeData: {
    tradeInfo: TradeInfo;
    tradeFeesData: TradeFeesData;
    liquidationParams: LiquidationParams;
    initialAccFees?: BorrowingFee.InitialAccFees;
  };

  // Additional parameters specific to liquidation calculation
  liquidationSpecific: {
    currentPairPrice: number;
    additionalFeeCollateral: number;
    partialCloseMultiplier: number;
    beforeOpened: boolean;
    isCounterTrade: boolean;
    userPriceImpact?: UserPriceImpact;
  };
};
