/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { LimitOrderRaw, LimitOrder } from "@/trade/types";
import { Contract, Provider } from "ethcall";
import { BlockTag, Contracts } from "../types";

export type FetchOpenLimitOrdersOverrides = {
  blockTag?: BlockTag;
  useMulticall?: boolean;
};

export const fetchOpenLimitOrders = async (
  contracts: Contracts,
  overrides: FetchOpenLimitOrdersOverrides = {}
): Promise<LimitOrder[]> => {
  const openLimitOrdersRaw = await fetchOpenLimitOrdersRaw(
    contracts,
    overrides
  );
  return openLimitOrdersRaw.map((order: LimitOrderRaw) => ({
    block: parseInt(order.block.toString()),
    buy: order.buy,
    index: parseInt(order.index.toString()),
    leverage: parseInt(order.leverage.toString()),
    maxPrice: parseFloat(order.maxPrice.toString()) / 1e10,
    minPrice: parseFloat(order.minPrice.toString()) / 1e10,
    pairIndex: parseInt(order.pairIndex.toString()),
    positionSize: parseFloat(order.positionSize.toString()) / 1e18,
    sl: parseFloat(order.sl.toString()) / 1e10,
    spreadReductionP: parseInt(order.spreadReductionP.toString()) / 100,
    tp: parseFloat(order.tp.toString()) / 1e10,
    trader: order.trader,
    type: parseInt(order.type.toString()),
  }));
};

export const fetchOpenLimitOrdersRaw = async (
  contracts: Contracts,
  overrides: FetchOpenLimitOrdersOverrides = {}
): Promise<any[]> => {
  if (!contracts) {
    return [];
  }
  console.time("fetchOpenLimitOrdersRaw");
  const { useMulticall = false, blockTag = "latest" } = overrides;

  const { gfarmTradingStorageV5: storageContract, gnsNftRewards: nftRewards } =
    contracts;

  const openLimitOrders = await storageContract.getOpenLimitOrders({
    blockTag,
  });

  let openLimitOrderTypes: number[] = [];
  if (useMulticall) {
    const multicallProvider = new Provider();
    await multicallProvider.init(storageContract.provider);
    const nftRewardsContractMulticall = new Contract(nftRewards.address, [
      ...nftRewards.interface.fragments,
    ]);
    openLimitOrderTypes = await multicallProvider.all(
      openLimitOrders.map(order =>
        nftRewardsContractMulticall.openLimitOrderTypes(
          order.trader,
          order.pairIndex,
          order.index
        )
      ),
      blockTag
    );
  } else {
    openLimitOrderTypes = await Promise.all(
      openLimitOrders.map(order =>
        nftRewards.openLimitOrderTypes(
          order.trader,
          order.pairIndex,
          order.index,
          { blockTag }
        )
      )
    );
  }

  return openLimitOrderTypes.map((openLimitOrderType, index) => {
    const openLimitOrder = openLimitOrders[index];
    return {
      trader: openLimitOrder.trader,
      pairIndex: openLimitOrder.pairIndex,
      index: openLimitOrder.index,
      positionSize: openLimitOrder.positionSize,
      spreadReductionP: openLimitOrder.spreadReductionP,
      buy: openLimitOrder.buy,
      leverage: openLimitOrder.leverage,
      tp: openLimitOrder.tp,
      sl: openLimitOrder.sl,
      minPrice: openLimitOrder.minPrice,
      maxPrice: openLimitOrder.maxPrice,
      block: openLimitOrder.block,
      type: openLimitOrderType,
    };
  });
};
