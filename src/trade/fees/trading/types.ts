/**
 * @dev Types for trading fee calculations (open/close position fees)
 */

import { Fee, CounterTradeSettings, GlobalTradeFeeParams } from "../../types";

/**
 * @dev Breakdown of trading fees into components
 */
export type TradeFeesBreakdown = {
  referralFeeCollateral: number;
  govFeeCollateral: number;
  triggerFeeCollateral: number;
  gnsOtcFeeCollateral: number;
  gTokenFeeCollateral: number;
};

/**
 * @dev Context for calculating trading fees
 */
export type GetTradeFeesContext = {
  fee: Fee;
  collateralPriceUsd: number;
  globalTradeFeeParams: GlobalTradeFeeParams;
  counterTradeSettings?: {
    [pairIndex: number]: CounterTradeSettings;
  };
  traderFeeMultiplier?: number; // e.g., 0.8 = 80% of normal fee
};

/**
 * @dev Context for calculating liquidation fees
 */
export type GetLiquidationFeesContext = {
  totalLiqCollateralFeeP: number;
  globalTradeFeeParams: GlobalTradeFeeParams;
  traderFeeMultiplier?: number;
};

/**
 * @dev Legacy support
 */
export type GetClosingFeeContext = GetTradeFeesContext;

/**
 * @dev Holding fees breakdown (funding + borrowing)
 */
export type TradeHoldingFees = {
  fundingFeeCollateral: number;
  borrowingFeeCollateral: number;
  borrowingFeeCollateral_old: number;
  totalFeeCollateral: number;
};

// Re-export GlobalTradeFeeParams for convenience
export type { GlobalTradeFeeParams };
