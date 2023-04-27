import {
  GFarmTradingStorageV5,
  GNSPairInfosV6_1,
  GNSPairsStorageV6,
  GTokenOpenPnlFeed,
  GNSNftRewardsV6_3_1,
  GNSBorrowingFeesV6_3_2,
  GNSTradingCallbacksV6_3_2,
} from "./generated";

export type Contracts = {
  gfarmTradingStorageV5: GFarmTradingStorageV5;
  gnsPairInfosV6_1: GNSPairInfosV6_1;
  gnsPairsStorageV6: GNSPairsStorageV6;
  gTokenOpenPnlFeed: GTokenOpenPnlFeed;
  gnsNftRewards: GNSNftRewardsV6_3_1;
  gnsBorrowingFees: GNSBorrowingFeesV6_3_2;
  gnsTradingCallbacks: GNSTradingCallbacksV6_3_2;
};

export type ContractAddresses = {
  gfarmTradingStorageV5: string;
  gnsPairInfosV6_1: string;
  gnsPairsStorageV6: string;
  gTokenOpenPnlFeed: string;
  gnsNftRewardsV6: string;
  gnsNftRewardsV6_3_1: string;
  gnsBorrowingFeesV6_3_2: string;
  gnsTradingCallbacksV6_3_2: string;
};

export type BlockTag = number | "latest" | "pending";
