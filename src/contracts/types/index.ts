import { GTokenOpenPnlFeed, GToken, GNSMultiCollatDiamond } from "./generated";

export type Contracts = {
  gnsMultiCollatDiamond: GNSMultiCollatDiamond;
  gTokenOpenPnlFeed: GTokenOpenPnlFeed;
  gToken: GToken;
};
// @todo export all addresses
export type ContractAddresses = {
  gnsMultiCollatDiamond: string;
  gTokenOpenPnlFeed: string;
  gToken: string;
};

export type BlockTag = number | "latest" | "pending";

export enum CollateralTypes {
  DAI = "DAI",
  ETH = "ETH",
  ARB = "ARB",
  USDC = "USDC",
  APE = "APE",
}

export enum ContractsVersion {
  BEFORE_V9_2,
  V9_2,
}

export type ContractAddressList = Record<
  string,
  Partial<Record<CollateralTypes | "global", Partial<ContractAddresses>>>
>;

export enum ChainId {
  POLYGON = 137,
  ARBITRUM = 42161,
  ARBITRUM_SEPOLIA = 421614,
  BASE = 8453,
  APECHAIN = 33139,
}
