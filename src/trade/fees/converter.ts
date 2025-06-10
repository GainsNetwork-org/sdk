/**
 * @dev Converters for fee data between contract and SDK formats
 */

import { IFundingFees } from "../../contracts/types/generated/GNSMultiCollatDiamond";
import { TradeFeesData, UiRealizedPnlData } from "../types";
import { CollateralConfig } from "../../markets/collateral/types";

/**
 * @dev Converts contract TradeFeesData to SDK format
 * @param data Trade fees data from contract
 * @param collateralConfig Config for the collateral (contains decimals)
 * @returns Normalized trade fees data
 */
export const convertTradeFeesData = (
  data: IFundingFees.TradeFeesDataStructOutput,
  collateralConfig: CollateralConfig
): TradeFeesData => {
  const decimals = collateralConfig.decimals || 18;

  return {
    realizedTradingFeesCollateral:
      parseFloat(data.realizedTradingFeesCollateral.toString()) /
      10 ** decimals,
    realizedPnlCollateral:
      parseFloat(data.realizedPnlCollateral.toString()) / 10 ** decimals,
    manuallyRealizedNegativePnlCollateral:
      parseFloat(data.manuallyRealizedNegativePnlCollateral.toString()) /
      10 ** decimals,
    alreadyTransferredNegativePnlCollateral:
      parseFloat(data.alreadyTransferredNegativePnlCollateral.toString()) /
      10 ** decimals,
    virtualAvailableCollateralInDiamond:
      parseFloat(data.virtualAvailableCollateralInDiamond.toString()) /
      10 ** decimals,
    initialAccFundingFeeP:
      parseFloat(data.initialAccFundingFeeP.toString()) / 1e10,
    initialAccBorrowingFeeP:
      parseFloat(data.initialAccBorrowingFeeP.toString()) / 1e10,
  };
};

/**
 * @dev Converts array of TradeFeesData from contract
 * @param dataArray Array of trade fees data
 * @param collateralConfig Config for the collateral
 * @returns Array of normalized trade fees data
 */
export const convertTradeFeesDataArray = (
  dataArray: IFundingFees.TradeFeesDataStructOutput[],
  collateralConfig: CollateralConfig
): TradeFeesData[] => {
  return dataArray.map(data => convertTradeFeesData(data, collateralConfig));
};

/**
 * @dev Converts contract UiRealizedPnlData to SDK format
 * @param data UI realized PnL data from contract
 * @param collateralConfig Config for the collateral (contains decimals)
 * @returns Normalized UI realized PnL data
 */
export const convertUiRealizedPnlData = (
  data: IFundingFees.UiRealizedPnlDataStructOutput,
  collateralConfig: CollateralConfig
): UiRealizedPnlData => {
  const decimals = collateralConfig.decimals || 18;

  return {
    realizedTradingFeesCollateral:
      parseFloat(data.realizedTradingFeesCollateral.toString()) /
      10 ** decimals,
    realizedOldBorrowingFeesCollateral:
      parseFloat(data.realizedOldBorrowingFeesCollateral.toString()) /
      10 ** decimals,
    realizedNewBorrowingFeesCollateral:
      parseFloat(data.realizedNewBorrowingFeesCollateral.toString()) /
      10 ** decimals,
    realizedFundingFeesCollateral:
      parseFloat(data.realizedFundingFeesCollateral.toString()) /
      10 ** decimals,
    realizedPnlPartialCloseCollateral:
      parseFloat(data.realizedPnlPartialCloseCollateral.toString()) /
      10 ** decimals,
    pnlWithdrawnCollateral:
      parseFloat(data.pnlWithdrawnCollateral.toString()) / 10 ** decimals,
  };
};

/**
 * @dev Converts array of UiRealizedPnlData from contract
 * @param dataArray Array of UI realized PnL data
 * @param collateralConfig Config for the collateral
 * @returns Array of normalized UI realized PnL data
 */
export const convertUiRealizedPnlDataArray = (
  dataArray: IFundingFees.UiRealizedPnlDataStructOutput[],
  collateralConfig: CollateralConfig
): UiRealizedPnlData[] => {
  return dataArray.map(data =>
    convertUiRealizedPnlData(data, collateralConfig)
  );
};

/**
 * @dev Converts TradeFeesData to contract format (for encoding)
 * @param data SDK trade fees data
 * @param collateralConfig Config for the collateral
 * @returns Contract-formatted trade fees data
 */
export const encodeTradeFeesData = (
  data: TradeFeesData,
  collateralConfig: CollateralConfig
): IFundingFees.TradeFeesDataStruct => {
  const decimals = collateralConfig.decimals || 18;

  return {
    realizedTradingFeesCollateral: Math.round(
      data.realizedTradingFeesCollateral * 10 ** decimals
    ),
    realizedPnlCollateral: Math.round(
      data.realizedPnlCollateral * 10 ** decimals
    ),
    manuallyRealizedNegativePnlCollateral: Math.round(
      data.manuallyRealizedNegativePnlCollateral * 10 ** decimals
    ),
    alreadyTransferredNegativePnlCollateral: Math.round(
      data.alreadyTransferredNegativePnlCollateral * 10 ** decimals
    ),
    virtualAvailableCollateralInDiamond: Math.round(
      data.virtualAvailableCollateralInDiamond * 10 ** decimals
    ),
    __placeholder: 0,
    initialAccFundingFeeP: Math.round(data.initialAccFundingFeeP * 1e10),
    initialAccBorrowingFeeP: Math.round(data.initialAccBorrowingFeeP * 1e10),
  };
};

/**
 * @dev Converts UiRealizedPnlData to contract format (for encoding)
 * @param data SDK UI realized PnL data
 * @param collateralConfig Config for the collateral
 * @returns Contract-formatted UI realized PnL data
 */
export const encodeUiRealizedPnlData = (
  data: UiRealizedPnlData,
  collateralConfig: CollateralConfig
): IFundingFees.UiRealizedPnlDataStruct => {
  const decimals = collateralConfig.decimals || 18;

  return {
    realizedTradingFeesCollateral: Math.round(
      data.realizedTradingFeesCollateral * 10 ** decimals
    ),
    realizedOldBorrowingFeesCollateral: Math.round(
      data.realizedOldBorrowingFeesCollateral * 10 ** decimals
    ),
    realizedNewBorrowingFeesCollateral: Math.round(
      data.realizedNewBorrowingFeesCollateral * 10 ** decimals
    ),
    realizedFundingFeesCollateral: Math.round(
      data.realizedFundingFeesCollateral * 10 ** decimals
    ),
    realizedPnlPartialCloseCollateral: Math.round(
      data.realizedPnlPartialCloseCollateral * 10 ** decimals
    ),
    pnlWithdrawnCollateral: Math.round(
      data.pnlWithdrawnCollateral * 10 ** decimals
    ),
  };
};
