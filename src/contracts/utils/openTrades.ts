/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { TradeContainer, TradeContainerRaw } from "../../trade/types";
import { Contracts, BlockTag } from "../../contracts/types";
import {
  IBorrowingFees,
  IFundingFees,
} from "../types/generated/GNSMultiCollatDiamond";
import { Contract, Provider } from "ethcall";

export type FetchOpenPairTradesOverrides = {
  batchSize?: number;
  useMulticall?: boolean;
  includeLimits?: boolean;
  blockTag?: BlockTag;
  includeUIRealizedPnlData?: boolean;
};
export const fetchOpenPairTrades = async (
  contracts: Contracts,
  overrides: FetchOpenPairTradesOverrides = {}
): Promise<TradeContainer[]> => {
  const rawTrades = await fetchOpenPairTradesRaw(contracts, overrides);
  const collateralPrecisions = (
    await contracts.gnsMultiCollatDiamond.getCollaterals()
  ).map(({ precision }) => precision);

  return rawTrades.map(rawTrade =>
    _prepareTradeContainer(
      rawTrade.trade,
      rawTrade.tradeInfo,
      rawTrade.liquidationParams,
      rawTrade.initialAccFees,
      rawTrade.tradeFeesData,
      rawTrade.uiRealizedPnlData,
      collateralPrecisions[
        parseInt(rawTrade.trade.collateralIndex.toString()) - 1
      ]
    )
  );
};

// @todo rename
export const fetchOpenPairTradesRaw = async (
  contracts: Contracts,
  overrides: FetchOpenPairTradesOverrides = {}
): Promise<TradeContainerRaw[]> => {
  if (!contracts) {
    return [];
  }

  const {
    batchSize = 50,
    includeLimits = true,
    useMulticall = false,
    includeUIRealizedPnlData = true,
  } = overrides;

  const { gnsMultiCollatDiamond: multiCollatDiamondContract } = contracts;

  try {
    const multicallCtx = {
      provider: new Provider(),
      diamond: new Contract(multiCollatDiamondContract.address, [
        ...multiCollatDiamondContract.interface.fragments,
      ]),
    };

    if (useMulticall) {
      await multicallCtx.provider.init(multiCollatDiamondContract.provider);
    }

    let allOpenPairTrades: TradeContainerRaw[] = [];
    let running = true;
    let offset = 0;

    while (running) {
      const [trades, tradeInfos, tradeLiquidationParams] = await Promise.all([
        multiCollatDiamondContract.getAllTrades(offset, offset + batchSize),
        multiCollatDiamondContract.getAllTradeInfos(offset, offset + batchSize),
        multiCollatDiamondContract.getAllTradesLiquidationParams(
          offset,
          offset + batchSize
        ),
      ]);

      const fundingFeesCallParams: [string[], any[]] = [
        [], // traders
        [], // indices
      ];

      // Array is always of length `batchSize`
      // so we need to filter out the empty trades, indexes are reliable
      const openTrades = trades
        .filter(
          t =>
            t.collateralIndex > 0 &&
            (includeLimits || (!includeLimits && t.tradeType === 0))
        )
        .map((trade, ix): TradeContainerRaw => {
          fundingFeesCallParams[0].push(trade.user);
          fundingFeesCallParams[1].push(trade.index);
          return {
            trade,
            tradeInfo: tradeInfos[ix],
            liquidationParams: tradeLiquidationParams[ix],
            initialAccFees: {
              accPairFee: 0,
              accGroupFee: 0,
              block: 0,
              __placeholder: 0,
            },
            tradeFeesData: {
              realizedTradingFeesCollateral: 0,
              realizedPnlCollateral: 0,
              manuallyRealizedNegativePnlCollateral: 0,
              alreadyTransferredNegativePnlCollateral: 0,
              virtualAvailableCollateralInDiamond: 0,
              initialAccFundingFeeP: 0,
              initialAccBorrowingFeeP: 0,
              __placeholder: 0,
            },
            uiRealizedPnlData: undefined,
          };
        });

      const [tradeFeesData, uiRealizedPnlData]: [
        IFundingFees.TradeFeesDataStruct[],
        IFundingFees.UiRealizedPnlDataStruct[]
      ] = await Promise.all([
        multiCollatDiamondContract.getTradeFeesDataArray(
          ...fundingFeesCallParams
        ),
        includeUIRealizedPnlData
          ? multiCollatDiamondContract.getTradeUiRealizedPnlDataArray(
              ...fundingFeesCallParams
            )
          : [],
      ]);

      const initialAccFeesPromises = openTrades
        .map(({ trade }) => ({
          collateralIndex: trade.collateralIndex,
          user: trade.user,
          index: trade.index,
        }))
        .map(({ collateralIndex, user, index }) =>
          (useMulticall
            ? multicallCtx.diamond
            : multiCollatDiamondContract
          ).getBorrowingInitialAccFees(collateralIndex, user, index)
        );

      const initialAccFees: IBorrowingFees.BorrowingInitialAccFeesStructOutput[] =
        await (useMulticall
          ? multicallCtx.provider.all(initialAccFeesPromises)
          : Promise.all(initialAccFeesPromises));

      initialAccFees.forEach((accFees, ix) => {
        openTrades[ix].initialAccFees = accFees;
        openTrades[ix].tradeFeesData = tradeFeesData[ix];
        openTrades[ix].uiRealizedPnlData = uiRealizedPnlData?.[ix];
      });

      allOpenPairTrades = allOpenPairTrades.concat(openTrades);
      offset += batchSize + 1;
      running =
        parseInt(trades[trades.length - 1].collateralIndex.toString()) > 0;
    }

    return allOpenPairTrades;
  } catch (error) {
    console.error(`Unexpected error while fetching open pair trades!`);

    throw error;
  }
};

const _prepareTradeContainer = (
  trade: any,
  tradeInfo: any,
  tradeLiquidationParams: any,
  tradeInitialAccFees: any,
  tradeFeesData: any,
  uiRealizedPnlData: any,
  collateralPrecision: any
) => {
  const precision = parseFloat(collateralPrecision.toString());
  return {
    trade: {
      user: trade.user,
      index: parseInt(trade.index.toString()),
      pairIndex: parseInt(trade.pairIndex.toString()),
      leverage: parseFloat(trade.leverage.toString()) / 1e3,
      long: trade.long.toString() === "true",
      isOpen: trade.isOpen.toString() === "true",
      collateralIndex: parseInt(trade.collateralIndex.toString()),
      tradeType: trade.tradeType,
      collateralAmount:
        parseFloat(trade.collateralAmount.toString()) / precision,
      openPrice: parseFloat(trade.openPrice.toString()) / 1e10,
      tp: parseFloat(trade.tp.toString()) / 1e10,
      sl: parseFloat(trade.sl.toString()) / 1e10,
    },
    tradeInfo: {
      createdBlock: parseInt(tradeInfo.createdBlock.toString()),
      tpLastUpdatedBlock: parseInt(tradeInfo.tpLastUpdatedBlock.toString()),
      slLastUpdatedBlock: parseInt(tradeInfo.slLastUpdatedBlock.toString()),
      maxSlippageP: parseFloat(tradeInfo.maxSlippageP.toString()) / 1e3,
      lastOiUpdateTs: parseFloat(tradeInfo.lastOiUpdateTs),
      collateralPriceUsd:
        parseFloat(tradeInfo.collateralPriceUsd.toString()) / 1e8,
      contractsVersion: parseInt(tradeInfo.contractsVersion.toString()),
      lastPosIncreaseBlock: parseInt(tradeInfo.lastPosIncreaseBlock.toString()),
    },
    liquidationParams: {
      maxLiqSpreadP:
        parseFloat(tradeLiquidationParams.maxLiqSpreadP.toString()) / 1e12,
      startLiqThresholdP:
        parseFloat(tradeLiquidationParams.startLiqThresholdP.toString()) / 1e12,
      endLiqThresholdP:
        parseFloat(tradeLiquidationParams.endLiqThresholdP.toString()) / 1e12,
      startLeverage:
        parseFloat(tradeLiquidationParams.startLeverage.toString()) / 1e3,
      endLeverage:
        parseFloat(tradeLiquidationParams.endLeverage.toString()) / 1e3,
    },
    initialAccFees: {
      accPairFee: parseFloat(tradeInitialAccFees.accPairFee.toString()) / 1e10,
      accGroupFee:
        parseFloat(tradeInitialAccFees.accGroupFee.toString()) / 1e10,
      block: parseFloat(tradeInitialAccFees.block.toString()),
    },
    tradeFeesData: {
      realizedTradingFeesCollateral:
        parseFloat(tradeFeesData.realizedTradingFeesCollateral.toString()) /
        precision,
      realizedPnlCollateral:
        parseFloat(tradeFeesData.realizedPnlCollateral.toString()) / precision,
      manuallyRealizedNegativePnlCollateral:
        parseFloat(
          tradeFeesData.manuallyRealizedNegativePnlCollateral.toString()
        ) / precision,
      alreadyTransferredNegativePnlCollateral:
        parseFloat(
          tradeFeesData.alreadyTransferredNegativePnlCollateral.toString()
        ) / precision,
      virtualAvailableCollateralInDiamond:
        parseFloat(
          tradeFeesData.virtualAvailableCollateralInDiamond.toString()
        ) / precision,
      initialAccFundingFeeP:
        parseFloat(tradeFeesData.initialAccFundingFeeP.toString()) / 1e10,
      initialAccBorrowingFeeP:
        parseFloat(tradeFeesData.initialAccFundingFeeP.toString()) / 1e10,
    },
    uiRealizedPnlData: uiRealizedPnlData
      ? {
          realizedTradingFeesCollateral:
            parseFloat(
              uiRealizedPnlData.realizedTradingFeesCollateral.toString()
            ) / precision,
          realizedOldBorrowingFeesCollateral:
            parseFloat(
              uiRealizedPnlData.realizedOldBorrowingFeesCollateral.toString()
            ) / precision,
          realizedNewBorrowingFeesCollateral:
            parseFloat(
              uiRealizedPnlData.realizedNewBorrowingFeesCollateral.toString()
            ) / precision,
          realizedFundingFeesCollateral:
            parseFloat(
              uiRealizedPnlData.realizedFundingFeesCollateral.toString()
            ) / precision,
          realizedPnlPartialCloseCollateral:
            parseFloat(
              uiRealizedPnlData.realizedPnlPartialCloseCollateral.toString()
            ) / precision,
          pnlWithdrawnCollateral:
            parseFloat(uiRealizedPnlData.pnlWithdrawnCollateral.toString()) /
            precision,
        }
      : undefined,
  };
};
