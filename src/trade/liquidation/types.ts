import { GetBorrowingFeeContext, BorrowingFee } from "./../fees";
import { GetLiquidationFeesContext } from "./../fees/trading";
import { BorrowingFeeV2 } from "./../fees/borrowingV2";
import { LiquidationParams, UserPriceImpact, TradeFeesData } from "./../types";
import { ContractsVersion } from "../../contracts/types";

/**
 * @dev Input parameters for getTradeLiquidationPrice
 * @dev Mirrors the contract's LiqPriceInput struct
 */
export type LiqPriceInput = {
  collateralIndex: number;
  trader: string;
  pairIndex: number;
  index: number;
  openPrice: number; // SDK uses floats, not 1e10
  long: boolean;
  collateral: number; // SDK uses floats, not 1e18/1e6
  leverage: number; // SDK uses floats, not 1e3
  additionalFeeCollateral: number; // SDK uses floats
  liquidationParams: LiquidationParams;
  currentPairPrice: number; // SDK uses floats, not 1e10
  isCounterTrade: boolean;
  partialCloseMultiplier: number; // SDK uses floats, not 1e18
  beforeOpened: boolean;
};

export type GetLiquidationPriceContext = GetBorrowingFeeContext &
  BorrowingFeeV2.GetBorrowingFeeV2Context &
  GetLiquidationFeesContext & {
    liquidationParams: LiquidationParams | undefined;
    pairSpreadP: number | undefined;
    collateralPriceUsd: number | undefined;
    contractsVersion: ContractsVersion | undefined;
    userPriceImpact?: UserPriceImpact | undefined;

    // V10 additions
    currentPairPrice?: number;
    isCounterTrade?: boolean;
    tradeFeesData?: TradeFeesData;
    partialCloseMultiplier?: number;
    additionalFeeCollateral?: number;
    beforeOpened?: boolean;

    // V1 borrowing fees data
    initialAccFees?: BorrowingFee.InitialAccFees;

    // Optional funding fees context for v10
    fundingParams?: Record<number, Record<number, any>>;
    fundingData?: Record<number, Record<number, any>>;
    pairOiAfterV10?: Record<number, Record<number, any>>;
    netExposureToken?: Record<number, Record<number, number>>;
    netExposureUsd?: Record<number, Record<number, number>>;
  };
