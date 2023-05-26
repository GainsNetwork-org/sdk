/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Contract, Provider, Call } from "ethcall";
import { TradeContainer, TradeContainerRaw } from "@/trade/types";
import { Contracts, BlockTag } from "@/contracts/types";

export type FetchOpenPairTradesOverrides = {
  pairBatchSize?: number;
  useMulticall?: boolean;
  blockTag?: BlockTag;
};
export const fetchOpenPairTrades = async (
  contracts: Contracts,
  overrides: FetchOpenPairTradesOverrides = {}
): Promise<TradeContainer[]> => {
  const rawTrades = await fetchOpenPairTradesRaw(contracts, overrides);
  return rawTrades.map(rawTrade =>
    _prepareTradeContainer(
      rawTrade.trade,
      rawTrade.tradeInfo,
      rawTrade.initialAccFees
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
    pairBatchSize = 10,
    useMulticall = false,
    blockTag = "latest",
  } = overrides;

  const { gnsPairsStorageV6: pairsStorageContract } = contracts;

  try {
    const totalPairIndexes =
      (await pairsStorageContract.pairsCount({ blockTag })).toNumber() - 1;
    let allOpenPairTrades: TradeContainerRaw[] = [];

    for (
      let batchStartPairIndex = 0;
      batchStartPairIndex < totalPairIndexes;
      batchStartPairIndex += pairBatchSize
    ) {
      const batchEndPairIndex = Math.min(
        batchStartPairIndex + pairBatchSize - 1,
        totalPairIndexes
      );

      const openPairTradesBatch = useMulticall
        ? await fetchOpenPairTradesBatchMulticall(
            contracts,
            batchStartPairIndex,
            batchEndPairIndex,
            blockTag
          )
        : await fetchOpenPairTradesBatch(
            contracts,
            batchStartPairIndex,
            batchEndPairIndex
          );

      allOpenPairTrades = allOpenPairTrades.concat(openPairTradesBatch);
    }

    return allOpenPairTrades;
  } catch (error) {
    console.error(`Unexpected error while fetching open pair trades!`);

    throw error;
  }
};

const fetchOpenPairTradesBatch = async (
  contracts: Contracts,
  startPairIndex: number,
  endPairIndex: number
): Promise<TradeContainerRaw[]> => {
  const {
    gfarmTradingStorageV5: storageContract,
    gnsBorrowingFees: borrowingFeesContract,
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

          const [actualOpenTradesTradeInfos, actualOpenTradesInitialAccFees] =
            await Promise.all([
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
                  borrowingFeesContract.getTradeInitialAccFees(
                    aot.trader,
                    aot.pairIndex,
                    aot.index
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

            const tradeInitialAccFees = {
              ...actualOpenTradesInitialAccFees[tradeIndex].otherFees,
              borrowing:
                actualOpenTradesInitialAccFees[tradeIndex].borrowingFees,
            };

            const trade = actualOpenTradesForTrader[tradeIndex];

            finalOpenTradesForTrader[tradeIndex] = {
              trade,
              tradeInfo,
              initialAccFees: tradeInitialAccFees,
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

const fetchOpenPairTradesBatchMulticall = async (
  contracts: Contracts,
  startPairIndex: number,
  endPairIndex: number,
  blockTag: BlockTag
): Promise<TradeContainerRaw[]> => {
  const {
    gfarmTradingStorageV5: storageContract,
    gnsBorrowingFees: borrowingFeesContract,
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

  const [openTradesTradeInfos, openTradesInitialAccFees] = await Promise.all([
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
      Awaited<ReturnType<typeof borrowingFeesContract.getTradeInitialAccFees>>
    >(
      openTrades.map(openTrade =>
        borrowingFeesContractMulticall.getTradeInitialAccFees(
          openTrade.trader,
          openTrade.pairIndex,
          openTrade.index
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

    const tradeInitialAccFees = {
      ...openTradesInitialAccFees[tradeIndex].otherFees,
      borrowing: openTradesInitialAccFees[tradeIndex].borrowingFees,
    };

    const trade = openTrades[tradeIndex];

    finalTrades[tradeIndex] = {
      trade,
      tradeInfo,
      initialAccFees: tradeInitialAccFees,
    };
  }

  return finalTrades.filter(trade => trade !== undefined);
};

const _prepareTradeContainer = (
  trade: any,
  tradeInfo: any,
  tradeInitialAccFees: any
) => ({
  trade: {
    trader: trade.trader,
    pairIndex: parseInt(trade.pairIndex.toString()),
    index: parseInt(trade.index.toString()),
    initialPosToken: parseFloat(trade.initialPosToken.toString()) / 1e18,
    openPrice: parseFloat(trade.openPrice.toString()) / 1e10,
    buy: trade.buy.toString() === "true",
    leverage: parseInt(trade.leverage.toString()),
    tp: parseFloat(trade.tp.toString()) / 1e10,
    sl: parseFloat(trade.sl.toString()) / 1e10,
  },
  tradeInfo: {
    beingMarketClosed: tradeInfo.beingMarketClosed.toString() === "true",
    tokenPriceDai: parseFloat(tradeInfo.tokenPriceDai.toString()) / 1e10,
    openInterestDai: parseFloat(tradeInfo.openInterestDai.toString()) / 1e18,
    tpLastUpdated: tradeInfo.tpLastUpdated,
    slLastUpdated: tradeInfo.slLastUpdated,
  },
  initialAccFees: {
    rollover: parseFloat(tradeInitialAccFees.rollover.toString()) / 1e18,
    funding: parseFloat(tradeInitialAccFees.funding.toString()) / 1e18,
    openedAfterUpdate:
      tradeInitialAccFees.openedAfterUpdate.toString() === "true",
    borrowing: {
      accPairFee:
        parseFloat(tradeInitialAccFees.borrowing.accPairFee.toString()) / 1e10,
      accGroupFee:
        parseFloat(tradeInitialAccFees.borrowing.accGroupFee.toString()) / 1e10,
      block: parseFloat(tradeInitialAccFees.borrowing.block.toString()),
    },
  },
});
