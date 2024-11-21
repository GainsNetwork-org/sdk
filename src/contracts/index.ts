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
import { ChainId, CollateralTypes, Contracts } from "./types";

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
  const { contracts } = getCollateralIndexAndContractsForChainByRequester(
    chainId,
    requester,
    signerOrProvider
  );
  return contracts;
};

export const getCollateralIndexAndContractsForChainByRequester = (
  chainId: number,
  requester: string,
  signerOrProvider?: Signer | Provider
): { contracts: Contracts; collateralIndex: number } => {
  const collateral = getCollateralByAddressForChain(chainId, requester);

  return {
    contracts: getContractsForChain(chainId, signerOrProvider, collateral),
    collateralIndex:
      COLLATERAL_TO_CHAIN_COLLATERAL_INDEX[chainId as ChainId]?.[collateral] ||
      0,
  };
};

export const COLLATERAL_TO_CHAIN_COLLATERAL_INDEX: Record<
  ChainId,
  Partial<Record<CollateralTypes, number>>
> = {
  [ChainId.POLYGON]: {
    [CollateralTypes.DAI]: 1,
    [CollateralTypes.ETH]: 2,
    [CollateralTypes.USDC]: 3,
  },
  [ChainId.ARBITRUM]: {
    [CollateralTypes.DAI]: 1,
    [CollateralTypes.ETH]: 2,
    [CollateralTypes.USDC]: 3,
  },
  [ChainId.ARBITRUM_SEPOLIA]: {
    [CollateralTypes.DAI]: 1,
    [CollateralTypes.ETH]: 2,
    [CollateralTypes.USDC]: 3,
  },
  [ChainId.BASE]: {
    [CollateralTypes.USDC]: 1,
  },
  [ChainId.APECHAIN]: {
    [CollateralTypes.APE]: 1,
  },
};

// @deprecated use `COLLATERAL_TO_CHAIN_COLLATERAL_INDEX` instead
export const COLLATERAL_TO_COLLATERAL_INDEX: Record<CollateralTypes, number> = {
  [CollateralTypes.DAI]: 1,
  [CollateralTypes.ETH]: 2,
  [CollateralTypes.USDC]: 3,
  [CollateralTypes.ARB]: 0, // not in use
  [CollateralTypes.APE]: 0, // not in use
};

export * from "./utils";
export * from "./addresses";
export { CollateralTypes } from "./types";
