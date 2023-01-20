import {
  GFarmTradingStorageV5,
  GNSPairInfosV6_1,
  GNSPairsStorageV6,
  GTokenOpenPnlFeed,
  GNSNftRewardsV6,
} from "./generated";

export type Contracts = {
  gfarmTradingStorageV5: GFarmTradingStorageV5;
  gnsPairInfosV6_1: GNSPairInfosV6_1;
  gnsPairsStorageV6: GNSPairsStorageV6;
  gTokenOpenPnlFeed: GTokenOpenPnlFeed;
  gnsNftRewardsV6: GNSNftRewardsV6;
};

export type ContractAddresses = {
  gfarmTradingStorageV5: string;
  gnsPairInfosV6_1: string;
  gnsPairsStorageV6: string;
  gTokenOpenPnlFeed: string;
  gnsNftRewardsV6: string;
};

export type BlockTag = number | "latest" | "pending";
