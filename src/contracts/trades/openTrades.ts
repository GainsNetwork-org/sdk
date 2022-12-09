/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { TradeContainer } from "@/trade/types";
import {
  GFarmTradingStorageV5,
  GNSPairInfosV6_1,
  GNSPairsStorageV6,
} from "../types";

export type FetchTradesTradingContracts = {
  storage: GFarmTradingStorageV5;
  pairInfos: GNSPairInfosV6_1;
  pairsStorage: GNSPairsStorageV6;
};

export const fetchOpenPairTrades = async (
  contracts: FetchTradesTradingContracts,
  pairBatchSize = 10
): Promise<TradeContainer[]> => {
  if (!contracts) {
    return [];
  }

  const { pairsStorage: pairsStorageContract } = contracts;

  try {
    const totalPairIndexes =
      (await pairsStorageContract.pairsCount()).toNumber() - 1;

    let allOpenPairTrades: TradeContainer[] = [];

    for (
      let batchStartPairIndex = 0;
      batchStartPairIndex < totalPairIndexes;
      batchStartPairIndex += pairBatchSize
    ) {
      const batchEndPairIndex = Math.min(
        batchStartPairIndex + pairBatchSize - 1,
        totalPairIndexes
      );

      const openPairTradesBatch = await fetchOpenPairTradesBatch(
        contracts,
        batchStartPairIndex,
        batchEndPairIndex
      );

      allOpenPairTrades = allOpenPairTrades.concat(openPairTradesBatch);
    }

    console.info(
      `Fetched ${allOpenPairTrades.length} total open pair trade(s).`
    );

    return allOpenPairTrades;
  } catch (error) {
    console.error(`Unexpected error while fetching open pair trades!`);

    throw error;
  }
};

const fetchOpenPairTradesBatch = async (
  contracts: FetchTradesTradingContracts,
  startPairIndex: number,
  endPairIndex: number
): Promise<TradeContainer[]> => {
  const { storage: storageContract, pairInfos: pairInfosContract } = contracts;

  const maxTradesPerPair = (
    await storageContract.maxTradesPerPair()
  ).toNumber();

  const pairIndexesToFetch = Array.from(
    { length: endPairIndex - startPairIndex + 1 },
    (_, i) => i + startPairIndex
  );

  const rawTrades = await Promise.all(
    pairIndexesToFetch.map(async pairIndex => {
      console.debug(`Fetching pair traders for pairIndex ${pairIndex}...`);

      const pairTradersCallStartTime = performance.now();

      const pairTraderAddresses = await storageContract.pairTradersArray(
        pairIndex
      );

      if (pairTraderAddresses.length === 0) {
        console.debug(
          `No pair traders found for pairIndex ${pairIndex}; no processing left to do!`
        );

        return [];
      }

      console.debug(
        `Fetched ${
          pairTraderAddresses.length
        } pair traders for pairIndex ${pairIndex} in ${
          performance.now() - pairTradersCallStartTime
        }ms; now fetching all open trades...`
      );

      const openTradesForPairTraders = await Promise.all(
        pairTraderAddresses.map(async pairTraderAddress => {
          const openTradesCalls = new Array(maxTradesPerPair);

          const traderOpenTradesCallsStartTime = performance.now();

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

          console.debug(
            `Waiting on ${openTradesCalls.length} StorageContract::openTrades calls for trader ${pairTraderAddress}...`
          );

          const openTradesForTraderAddress = await Promise.all(openTradesCalls);

          console.debug(
            `Received all trades for trader ${pairTraderAddress} and pair ${pairIndex} in ${
              performance.now() - traderOpenTradesCallsStartTime
            }ms.`
          );

          // Filter out any of the trades that aren't *really* open (NOTE: these will have an empty trader address, so just test against that)
          const actualOpenTradesForTrader = openTradesForTraderAddress.filter(
            openTrade => openTrade.trader === pairTraderAddress
          );

          console.debug(
            `Filtered down to ${actualOpenTradesForTrader.length} actual open trades for trader ${pairTraderAddress} and pair ${pairIndex}; fetching corresponding trade info and initial fees...`
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
                  pairInfosContract.tradeInitialAccFees(
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
              console.error(
                "No trade info found for open trade while fetching open trades!",
                { trade: actualOpenTradesForTrader[tradeIndex] }
              );

              continue;
            }

            const tradeInitialAccFees =
              actualOpenTradesInitialAccFees[tradeIndex];

            if (tradeInitialAccFees === undefined) {
              console.error(
                "No initial fees found for open trade while fetching open trades!",
                { trade: actualOpenTradesForTrader[tradeIndex] }
              );

              continue;
            }

            const trade = actualOpenTradesForTrader[tradeIndex];

            finalOpenTradesForTrader[tradeIndex] = {
              trade: {
                trader: trade.trader,
                pairIndex: trade.pairIndex,
                index: trade.index,
                initialPosToken: trade.initialPosToken,
                openPrice: trade.openPrice,
                buy: trade.buy,
                leverage: trade.leverage,
                tp: trade.tp,
                sl: trade.sl,
              },
              tradeInfo: {
                beingMarketClosed: tradeInfo.beingMarketClosed,
                tokenPriceDai: tradeInfo.tokenPriceDai,
                openInterestDai: tradeInfo.openInterestDai,
                tpLastUpdated: tradeInfo.tpLastUpdated,
                slLastUpdated: tradeInfo.slLastUpdated,
              },
              initialAccFees: {
                rollover: tradeInitialAccFees.rollover,
                funding: tradeInitialAccFees.funding,
                openedAfterUpdate: tradeInitialAccFees.openedAfterUpdate,
              },
            };
          }

          console.debug(
            `Trade info and initial fees fetched for ${finalOpenTradesForTrader.length} trades for trader ${pairTraderAddress} and pair ${pairIndex}; done!`
          );

          return finalOpenTradesForTrader;
        })
      );

      return openTradesForPairTraders;
    })
  );

  const perPairTrades = rawTrades.reduce((a, b) => a.concat(b), []);
  return perPairTrades.reduce((a, b) => a.concat(b), []);
};
