import {
  convertCollaterals,
  convertFees,
  convertFeeTiers,
  convertGlobalTradeFeeParams,
  convertMaxLeverages,
  convertOiWindows,
  convertOiWindowsSettings,
  convertPairDepths,
  convertPairFactor,
  convertTradingGroups,
  convertTradingPairs,
  generateStockPairToActiveStockSplit,
} from "./converter";
import {
  GlobalTradingVariablesType,
  TradingVariablesCollateral,
  TransformedGlobalTradingVariables,
} from "./types";
import { GlobalTradingVariablesBackend } from "./backend.types";
import {
  convertCounterTradeSettingsArray,
  convertLiquidationParams,
  Pair,
  PairIndexes,
} from "../../trade";

export const transformGlobalTradingVariables = (
  rawData: GlobalTradingVariablesBackend
): TransformedGlobalTradingVariables => {
  const globalTradingVariables: GlobalTradingVariablesType = {
    collaterals: convertCollaterals(rawData.collaterals),
    pairs: convertTradingPairs(rawData.pairs),
    stockPairToActiveStockSplit: generateStockPairToActiveStockSplit(
      rawData.pairs
    ),
    groups: convertTradingGroups(rawData.groups),
    fees: convertFees(rawData.fees),
    orderTimeout: rawData.marketOrdersTimeoutBlocks,
    blockConfirmations: rawData.blockConfirmations,
    forexClosed: !rawData.isForexOpen,
    stocksClosed: !rawData.isStocksOpen,
    indicesClosed: !rawData.isIndicesOpen,
    commoditiesClosed: !rawData.isCommoditiesOpen,
    pairDepths:
      rawData.pairInfos?.pairDepths !== undefined
        ? convertPairDepths(rawData.pairInfos.pairDepths)
        : [],
    pairMaxLeverages:
      rawData.pairInfos?.maxLeverages !== undefined
        ? convertMaxLeverages(rawData.pairInfos.maxLeverages)
        : [],
    maxNegativePnlOnOpenP:
      (rawData.maxNegativePnlOnOpenP && rawData.maxNegativePnlOnOpenP / 1e10) ||
      undefined,
    oiWindowsSettings:
      rawData.oiWindowsSettings !== undefined
        ? convertOiWindowsSettings(rawData.oiWindowsSettings)
        : { startTs: 0, windowsDuration: 0, windowsCount: 0 },
    oiWindows:
      rawData.oiWindows !== undefined
        ? convertOiWindows(rawData.oiWindows)
        : [],
    feeTiers: convertFeeTiers(rawData.feeTiers),
    liquidationParams: {
      groups:
        rawData.liquidationParams?.groups?.map(liqParams =>
          convertLiquidationParams(liqParams as any)
        ) || [],
      pairs:
        rawData.liquidationParams?.pairs?.map(liqParams =>
          convertLiquidationParams(liqParams as any)
        ) || [],
    },
    counterTradeSettings: convertCounterTradeSettingsArray(
      rawData.counterTradeSettings
    ),
    pairFactors:
      rawData.pairInfos?.pairFactors?.map(factor =>
        convertPairFactor(factor)
      ) || [],
    globalTradeFeeParams: rawData.globalTradeFeeParams
      ? convertGlobalTradeFeeParams(rawData.globalTradeFeeParams)
      : undefined,
    congestionLevels: rawData.congestionLevels,
  };

  const currentBlock =
    (rawData.currentBlock > -1 && rawData.currentBlock) || undefined;
  const l1BlockNumber =
    (rawData.currentL1Block > -1 && rawData.currentL1Block) || undefined;

  const pairIndexes: PairIndexes = {};
  for (let i = 0; i < rawData.pairs?.length; i++) {
    pairIndexes[rawData.pairs[i].from + "/" + rawData.pairs[i].to] = i;
  }

  if (globalTradingVariables.collaterals !== undefined) {
    const { collaterals } = globalTradingVariables;
    for (let i = 0; i < collaterals.length; i++) {
      collaterals[i].tradingPairs = getTradingPairs(
        globalTradingVariables.pairs,
        collaterals
      );
    }
  }

  return {
    globalTradingVariables,
    pairIndexes,
    blockNumber: currentBlock,
    l1BlockNumber,
  };
};

// Orphaned function
const getTradingPairs = (
  pairs: Pair[] | undefined,
  collaterals: TradingVariablesCollateral[]
): Map<number, Pair> => {
  const tradingPairs: Map<number, Pair> = new Map();
  if (pairs) {
    for (let j = 0; j < pairs.length; j++) {
      const pair = pairs[j];

      // pair is tradeable if any collateral is enabled (max oi > 0)
      if (
        collaterals.some(
          (collat: TradingVariablesCollateral) =>
            collat.pairOis[j].maxCollateral > 0
        )
      ) {
        tradingPairs.set(j, pair);
      }
    }
  }

  return tradingPairs;
};

// Re-export everything from backend.types
export * from "./backend.types";
export * from "./types";
