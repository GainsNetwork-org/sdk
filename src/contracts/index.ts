import type { Signer } from "ethers";
import type { Provider } from "@ethersproject/providers";
import {
  getCollateralByAddressForChain,
  getContractAddressesForChain,
} from "./addresses";
import {
  GTokenOpenPnlFeed__factory,
  GToken__factory,
  GNSMultiCollatDiamond__factory,
} from "./types/generated/factories";
import { CollateralTypes, Contracts } from "./types";

// @todo rework this to return all
export const getContractsForChain = (
  chainId: number,
  signerOrProvider?: Signer | Provider,
  collateral?: CollateralTypes
): Contracts => {
  const addresses = getContractAddressesForChain(chainId, collateral);

  return {
    gnsMultiCollatDiamond: GNSMultiCollatDiamond__factory.connect(
      addresses.gnsMultiCollatDiamond,
      signerOrProvider as Signer | Provider
    ),
    gTokenOpenPnlFeed: GTokenOpenPnlFeed__factory.connect(
      addresses.gTokenOpenPnlFeed,
      signerOrProvider as Signer | Provider
    ),
    gToken: GToken__factory.connect(
      addresses.gToken,
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
export { CollateralTypes } from "./types";
