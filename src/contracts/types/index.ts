import {
  GFarmTradingStorageV5,
  GTokenOpenPnlFeed,
  GNSNftRewardsV6_3_1,
  GNSBorrowingFees,
  GNSTradingCallbacks,
  GToken,
  GNSMultiCollatDiamond,
} from "./generated";

export type Contracts = {
  gfarmTradingStorageV5: GFarmTradingStorageV5;
  gTokenOpenPnlFeed: GTokenOpenPnlFeed;
  gnsNftRewards: GNSNftRewardsV6_3_1;
  gnsBorrowingFees: GNSBorrowingFees;
  gnsTradingCallbacks: GNSTradingCallbacks;
  gToken: GToken;
  gnsMultiCollatDiamond: GNSMultiCollatDiamond;
};

export type ContractAddresses = {
  gfarmTradingStorageV5: string;
  gnsMultiCollatDiamond: string;
  gTokenOpenPnlFeed: string;
  gnsNftRewardsV6_3_1: string;
  gnsBorrowingFees: string;
  gnsTradingCallbacks: string;
  gToken: string;
};

export type BlockTag = number | "latest" | "pending";

export enum CollateralTypes {
  DAI = "DAI",
  ETH = "ETH",
  ARB = "ARB",
  USDC = "USDC",
}

export type ContractAddressList = Record<
  string,
  Partial<Record<CollateralTypes | "global", Partial<ContractAddresses>>>
>;
