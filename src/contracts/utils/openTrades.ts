/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { TradeContainer, TradeContainerRaw } from "../../trade/types";
import { Contracts, BlockTag } from "../../contracts/types";
import {
  IBorrowingFees,
  IFundingFees,
  IPairsStorage,
  ITradingStorage,
} from "../types/generated/GNSMultiCollatDiamond";
import { Contract, Provider } from "ethcall";
import { ethers } from "ethers";
import {
  convertTradeFeesData,
  convertUiRealizedPnlData,
  convertLiquidationParams,
} from "../../trade";
import { CollateralConfig } from "src/markets";

export type FetchOpenPairTradesOverrides = {
  traders?: string[];
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
  const collaterals = await contracts.gnsMultiCollatDiamond.getCollaterals();
  const collateralConfigs = collaterals.map(c => ({
    collateral: c.collateral,
    isActive: c.isActive,
    precision: parseFloat(c.precision.toString()),
    precisionDelta: parseFloat(c.precisionDelta.toString()),
  }));

  return rawTrades.map(rawTrade =>
    _prepareTradeContainer(
      rawTrade.trade,
      rawTrade.tradeInfo,
      rawTrade.liquidationParams,
      rawTrade.initialAccFees,
      rawTrade.tradeFeesData,
      rawTrade.uiRealizedPnlData,
      collateralConfigs[parseInt(rawTrade.trade.collateralIndex.toString()) - 1]
    )
  );
};

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
    traders = [],
  } = overrides;

  const { gnsMultiCollatDiamond: multiCollatDiamondContract } = contracts;

  try {
    const multicallCtx = {
      provider: new Provider(),
      diamond: new Contract(multiCollatDiamondContract.address, [
        ...multiCollatDiamondContract.interface.fragments,
      ]),
    };
    const validatedAddresses = _validateAddresses(traders || []);
    const forTraders = validatedAddresses.length > 0;

    if (useMulticall) {
      await multicallCtx.provider.init(multiCollatDiamondContract.provider);
    }

    let allOpenPairTrades: TradeContainerRaw[] = [];
    let running = true;
    let offset = 0;

    while (running) {
      const [trades, tradeInfos, tradeLiquidationParams]: [
        ITradingStorage.TradeStructOutput[],
        ITradingStorage.TradeInfoStructOutput[],
        IPairsStorage.GroupLiquidationParamsStructOutput[]
      ] = await Promise.all(
        forTraders
          ? [
              multiCollatDiamondContract.getAllTradesForTraders(
                validatedAddresses,
                offset,
                offset + batchSize
              ),
              multiCollatDiamondContract.getAllTradeInfosForTraders(
                validatedAddresses,
                offset,
                offset + batchSize
              ),
              multiCollatDiamondContract.getAllTradesLiquidationParamsForTraders(
                validatedAddresses,
                offset,
                offset + batchSize
              ),
            ]
          : [
              multiCollatDiamondContract.getAllTrades(
                offset,
                offset + batchSize
              ),
              multiCollatDiamondContract.getAllTradeInfos(
                offset,
                offset + batchSize
              ),
              multiCollatDiamondContract.getAllTradesLiquidationParams(
                offset,
                offset + batchSize
              ),
            ]
      );

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
  collateralConfig: CollateralConfig
): TradeContainer => {
  const precision = collateralConfig.precision;

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
      isCounterTrade: trade.isCounterTrade,
      positionSizeToken: parseFloat(trade.positionSizeToken.toString()) / 1e18,
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
    liquidationParams: convertLiquidationParams(tradeLiquidationParams),
    initialAccFees: {
      accPairFee: parseFloat(tradeInitialAccFees.accPairFee.toString()) / 1e10,
      accGroupFee:
        parseFloat(tradeInitialAccFees.accGroupFee.toString()) / 1e10,
      block: parseFloat(tradeInitialAccFees.block.toString()),
    },
    tradeFeesData: convertTradeFeesData(tradeFeesData, collateralConfig),
    uiRealizedPnlData: uiRealizedPnlData
      ? convertUiRealizedPnlData(uiRealizedPnlData, collateralConfig)
      : undefined,
  };
};

/**
 * Filters out duplicate addresses. Throws error if an invalid address is provided.
 * @param addresses
 */
const _validateAddresses = (addresses: string[]): string[] => {
  return [
    ...new Set(addresses.map(address => ethers.utils.getAddress(address))),
  ];
};
