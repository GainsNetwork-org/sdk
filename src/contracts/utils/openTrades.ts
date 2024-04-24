/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// import { Contract, Provider, Call } from "ethcall";
import { TradeContainer, TradeContainerRaw } from "../../trade/types";
import { Contracts, BlockTag } from "../../contracts/types";

export type FetchOpenPairTradesOverrides = {
  batchSize?: number;
  useMulticall?: boolean;
  blockTag?: BlockTag;
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
      rawTrade.initialAccFees,
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
    // useMulticall = false,
    // blockTag = "latest",
  } = overrides;

  const { gnsMultiCollatDiamond: multiCollatDiamondContract } = contracts;

  try {
    let allOpenPairTrades: TradeContainerRaw[] = [];
    let running = true;
    let offset = 0;

    while (running) {
      console.log("fetching with", offset, batchSize);
      const trades = await multiCollatDiamondContract.getAllTrades(
        offset,
        offset + batchSize
      );
      const tradeInfos = await multiCollatDiamondContract.getAllTradeInfos(
        offset,
        offset + batchSize
      );

      // Array is always of length `batchSize`
      // so we need to filter out the empty trades, indexes are reliable
      const openTrades = trades
        .filter(t => t.collateralIndex > 0)
        .map(
          (trade, ix): TradeContainerRaw => ({
            trade,
            tradeInfo: tradeInfos[ix],
            initialAccFees: {
              accPairFee: 0,
              accGroupFee: 0,
              block: 0,
              __placeholder: 0,
            }, // @todo fetch initialAccFees
          })
        );

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

// @todo deprecate
/*
const fetchOpenPairTradesBatch = async (
  contracts: Contracts,
  startPairIndex: number,
  endPairIndex: number
): Promise<TradeContainerRaw[]> => {
  const {
    gfarmTradingStorageV5: storageContract,
    gnsBorrowingFees: borrowingFeesContract,
    gnsTradingCallbacks: callbacksContract,
  } = contracts;

  const maxTradesPerPair = (
    await storageContract.maxTradesPerPair()
  ).toNumber();

  const pairIndexesToFetch = Array.from(
    { length: endPairIndex - startPairIndex + 1 },
    (_, i) => i + startPairIndex
  );

  const rawTrades = await Promise.all(
    pairIndexesToFetch.map(async pairIndex => {
      const pairTraderAddresses = await storageContract.pairTradersArray(
        pairIndex
      );

      if (pairTraderAddresses.length === 0) {
        return [];
      }

      const openTradesForPairTraders = await Promise.all(
        pairTraderAddresses.map(async pairTraderAddress => {
          const openTradesCalls = new Array(maxTradesPerPair);
          for (
            let pairTradeIndex = 0;
            pairTradeIndex < maxTradesPerPair;
            pairTradeIndex++
          ) {
            openTradesCalls[pairTradeIndex] = storageContract.openTrades(
              pairTraderAddress,
              pairIndex,
              pairTradeIndex
            );
          }

          const openTradesForTraderAddress = await Promise.all(openTradesCalls);

          // Filter out any of the trades that aren't *really* open (NOTE: these will have an empty trader address, so just test against that)
          const actualOpenTradesForTrader = openTradesForTraderAddress.filter(
            openTrade => openTrade.trader === pairTraderAddress
          );

          const [
            actualOpenTradesTradeInfos,
            actualOpenTradesInitialAccFees,
            actualOpenTradesTradeData,
          ] = await Promise.all([
            Promise.all(
              actualOpenTradesForTrader.map(aot =>
                storageContract.openTradesInfo(
                  aot.trader,
                  aot.pairIndex,
                  aot.index
                )
              )
            ),
            Promise.all(
              actualOpenTradesForTrader.map(aot =>
                borrowingFeesContract.initialAccFees(
                  aot.trader,
                  aot.pairIndex,
                  aot.index
                )
              )
            ),
            Promise.all(
              actualOpenTradesForTrader.map(aot =>
                callbacksContract.tradeData(
                  aot.trader,
                  aot.pairIndex,
                  aot.index,
                  0
                )
              )
            ),
          ]);

          const finalOpenTradesForTrader = new Array(
            actualOpenTradesForTrader.length
          );

          for (
            let tradeIndex = 0;
            tradeIndex < actualOpenTradesForTrader.length;
            tradeIndex++
          ) {
            const tradeInfo = actualOpenTradesTradeInfos[tradeIndex];

            if (tradeInfo === undefined) {
              continue;
            }

            if (actualOpenTradesInitialAccFees[tradeIndex] === undefined) {
              continue;
            }

            const trade = actualOpenTradesForTrader[tradeIndex];
            const tradeData = actualOpenTradesTradeData[tradeIndex];

            finalOpenTradesForTrader[tradeIndex] = {
              trade,
              tradeInfo,
              initialAccFees: {
                borrowing: actualOpenTradesInitialAccFees[tradeIndex],
              },
              tradeData,
            };
          }

          return finalOpenTradesForTrader;
        })
      );

      return openTradesForPairTraders;
    })
  );

  const perPairTrades = rawTrades.reduce((a, b) => a.concat(b), []);
  return perPairTrades.reduce((a, b) => a.concat(b), []);
};
*/
// @todo deprecate
/*
const fetchOpenPairTradesBatchMulticall = async (
  contracts: Contracts,
  startPairIndex: number,
  endPairIndex: number,
  blockTag: BlockTag
): Promise<TradeContainerRaw[]> => {
  const {
    gfarmTradingStorageV5: storageContract,
    gnsBorrowingFees: borrowingFeesContract,
    gnsTradingCallbacks: callbacksContract,
  } = contracts;

  // Convert to Multicall for efficient RPC usage
  const multicallProvider = new Provider();
  await multicallProvider.init(storageContract.provider);
  const storageContractMulticall = new Contract(storageContract.address, [
    ...storageContract.interface.fragments,
  ]);
  const borrowingFeesContractMulticall = new Contract(
    borrowingFeesContract.address,
    [...borrowingFeesContract.interface.fragments]
  );
  const callbacksContractMulticall = new Contract(callbacksContract.address, [
    ...callbacksContract.interface.fragments,
  ]);

  const maxTradesPerPair = (
    await storageContract.maxTradesPerPair()
  ).toNumber();

  const pairIndexesToFetch = Array.from(
    { length: endPairIndex - startPairIndex + 1 },
    (_, i) => i + startPairIndex
  );

  const mcPairTraderAddresses: string[][] = await multicallProvider.all(
    pairIndexesToFetch.map(pairIndex =>
      storageContractMulticall.pairTradersArray(pairIndex)
    ),
    blockTag
  );

  const mcFlatOpenTrades: any[] = await multicallProvider.all(
    mcPairTraderAddresses
      .map((pairTraderAddresses, _ix) => {
        return pairTraderAddresses
          .map((pairTraderAddress: string) => {
            const openTradesCalls: Call[] = new Array(maxTradesPerPair);
            for (
              let pairTradeIndex = 0;
              pairTradeIndex < maxTradesPerPair;
              pairTradeIndex++
            ) {
              openTradesCalls[pairTradeIndex] =
                storageContractMulticall.openTrades(
                  pairTraderAddress,
                  _ix + startPairIndex,
                  pairTradeIndex
                );
            }
            return openTradesCalls;
          })
          .reduce((acc, val) => acc.concat(val), []);
      })
      .reduce((acc, val) => acc.concat(val), [] as Call[]),
    blockTag
  );

  const openTrades = mcFlatOpenTrades.filter(
    openTrade => openTrade[0] !== "0x0000000000000000000000000000000000000000"
  );

  const [openTradesTradeInfos, openTradesInitialAccFees, openTradesTradeData] =
    await Promise.all([
      multicallProvider.all(
        openTrades.map(openTrade =>
          storageContractMulticall.openTradesInfo(
            openTrade.trader,
            openTrade.pairIndex,
            openTrade.index
          )
        ),
        blockTag
      ),
      multicallProvider.all<
        Awaited<ReturnType<typeof borrowingFeesContract.initialAccFees>>
      >(
        openTrades.map(openTrade =>
          borrowingFeesContractMulticall.initialAccFees(
            openTrade.trader,
            openTrade.pairIndex,
            openTrade.index
          )
        ),
        blockTag
      ),
      multicallProvider.all(
        openTrades.map(openTrade =>
          callbacksContractMulticall.tradeData(
            openTrade.trader,
            openTrade.pairIndex,
            openTrade.index,
            0
          )
        ),
        blockTag
      ),
    ]);

  const finalTrades = new Array(openTrades.length);

  for (
    let tradeIndex = 0;
    tradeIndex < openTradesTradeInfos.length;
    tradeIndex++
  ) {
    const tradeInfo = openTradesTradeInfos[tradeIndex];

    if (tradeInfo === undefined) {
      console.error(
        "No trade info found for open trade while fetching open trades!",
        { trade: openTradesTradeInfos[tradeIndex] }
      );

      continue;
    }

    if (openTradesInitialAccFees[tradeIndex] === undefined) {
      console.error(
        "No initial fees found for open trade while fetching open trades!",
        { trade: openTrades[tradeIndex] }
      );

      continue;
    }

    const trade = openTrades[tradeIndex];
    const tradeData = openTradesTradeData[tradeIndex];

    finalTrades[tradeIndex] = {
      trade,
      tradeInfo,
      initialAccFees: {
        borrowing: openTradesInitialAccFees[tradeIndex],
      },
      tradeData,
    };
  }

  return finalTrades.filter(trade => trade !== undefined);
};
 */

const _prepareTradeContainer = (
  trade: any,
  tradeInfo: any,
  tradeInitialAccFees: any,
  collateralPrecision: any
) => ({
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
      parseFloat(trade.collateralAmount.toString()) /
      parseFloat(collateralPrecision.toString()),
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
  },
  initialAccFees: {
    accPairFee: parseFloat(tradeInitialAccFees.accPairFee.toString()) / 1e10,
    accGroupFee: parseFloat(tradeInitialAccFees.accGroupFee.toString()) / 1e10,
    block: parseFloat(tradeInitialAccFees.block.toString()),
  },
});
