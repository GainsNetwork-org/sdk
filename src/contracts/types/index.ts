import {
  GFarmTradingStorageV5,
  GNSPairInfosV6_1,
  GNSPairsStorageV6,
  GTokenOpenPnlFeed,
} from "./generated";

export type Contracts = {
  gfarmTradingStorageV5: GFarmTradingStorageV5;
  gnsPairInfosV6_1: GNSPairInfosV6_1;
  gnsPairsStorageV6: GNSPairsStorageV6;
  gTokenOpenPnlFeed: GTokenOpenPnlFeed;
};

export type ContractAddresses = {
  gfarmTradingStorageV5: string;
  gnsPairInfosV6_1: string;
  gnsPairsStorageV6: string;
  gTokenOpenPnlFeed: string;
};
