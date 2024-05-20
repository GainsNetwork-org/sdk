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
}

export type ContractAddressList = Record<
  string,
  Partial<Record<CollateralTypes | "global", Partial<ContractAddresses>>>
>;
