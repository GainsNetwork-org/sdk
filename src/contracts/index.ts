import type { Signer } from "ethers";
import type { Provider } from "@ethersproject/providers";
import {
  getCollateralByAddressForChain,
  getContractAddressesForChain,
} from "./addresses";
import {
  GFarmTradingStorageV5__factory,
  GTokenOpenPnlFeed__factory,
  GNSNftRewardsV6_3_1__factory,
  GNSBorrowingFees__factory,
  GNSTradingCallbacks__factory,
  GTokenV6_3_2__factory,
  GNSMultiCollatDiamond__factory,
} from "./types/generated/factories";
import { CollateralTypes, Contracts } from "./types";

export const getContractsForChain = (
  chainId: number,
  signerOrProvider?: Signer | Provider,
  collateral?: CollateralTypes
): Contracts => {
  const addresses = getContractAddressesForChain(chainId, collateral);

  return {
    gfarmTradingStorageV5: GFarmTradingStorageV5__factory.connect(
      addresses.gfarmTradingStorageV5,
      signerOrProvider as Signer | Provider
    ),
    gnsMultiCollatDiamond: GNSMultiCollatDiamond__factory.connect(
      addresses.gnsMultiCollatDiamond,
      signerOrProvider as Signer | Provider
    ),
    gTokenOpenPnlFeed: GTokenOpenPnlFeed__factory.connect(
      addresses.gTokenOpenPnlFeed,
      signerOrProvider as Signer | Provider
    ),
    gnsNftRewards: GNSNftRewardsV6_3_1__factory.connect(
      addresses.gnsNftRewardsV6_3_1,
      signerOrProvider as Signer | Provider
    ),
    gnsBorrowingFees: GNSBorrowingFees__factory.connect(
      addresses.gnsBorrowingFees,
      signerOrProvider as Signer | Provider
    ),
    gnsTradingCallbacks: GNSTradingCallbacks__factory.connect(
      addresses.gnsTradingCallbacks,
      signerOrProvider as Signer | Provider
    ),
    gDai: GTokenV6_3_2__factory.connect(
      addresses.gDai,
      signerOrProvider as Signer | Provider
    ),
  };
};

export const getContractsForChainByRequester = (
  chainId: number,
  requester: string,
  signerOrProvider?: Signer | Provider
): Contracts => {
  return getContractsForChain(
    chainId,
    signerOrProvider,
    getCollateralByAddressForChain(chainId, requester)
  );
};

export * from "./utils";
export * from "./addresses";
