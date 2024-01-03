import {
  GFarmTradingStorageV5,
  GTokenOpenPnlFeed,
  GNSNftRewardsV6_3_1,
  GNSBorrowingFees,
  GNSTradingCallbacks,
  GTokenV6_3_2,
  GNSMultiCollatDiamond,
} from "./generated";

export type Contracts = {
  gfarmTradingStorageV5: GFarmTradingStorageV5;
  gTokenOpenPnlFeed: GTokenOpenPnlFeed;
  gnsNftRewards: GNSNftRewardsV6_3_1;
  gnsBorrowingFees: GNSBorrowingFees;
  gnsTradingCallbacks: GNSTradingCallbacks;
  gDai: GTokenV6_3_2;
  gnsMultiCollatDiamond: GNSMultiCollatDiamond;
};

export type ContractAddresses = {
  gfarmTradingStorageV5: string;
  gnsMultiCollatDiamond: string;
  gTokenOpenPnlFeed: string;
  gnsNftRewardsV6: string;
  gnsNftRewardsV6_3_1: string;
  gnsBorrowingFees: string;
  gnsTradingCallbacks: string;
  gDai: string;
};

export type BlockTag = number | "latest" | "pending";

export enum CollateralTypes {
  DAI = "DAI",
  ETH = "ETH",
  ARB = "ARB",
  USDC = "USDC",
}
