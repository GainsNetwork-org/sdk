import type { Signer } from "ethers";
import type { Provider } from "@ethersproject/providers";
import { getContractAddressesForChainOrThrow } from "./addresses";
import {
  GFarmTradingStorageV5__factory,
  GNSPairInfosV6_1__factory,
  GNSPairsStorageV6__factory,
} from "./types/generated/factories";
import { Contracts } from "./types";

export const getContractsForChainOrThrow = (
  chainId: number,
  signerOrProvider?: Signer | Provider
): Contracts => {
  const addresses = getContractAddressesForChainOrThrow(chainId);

  return {
    gfarmTradingStorageV5: GFarmTradingStorageV5__factory.connect(
      addresses.gfarmTradingStorageV5,
      signerOrProvider as Signer | Provider
    ),
    gnsPairInfosV6_1: GNSPairInfosV6_1__factory.connect(
      addresses.gnsPairInfosV6_1,
      signerOrProvider as Signer | Provider
    ),
    gnsPairsStorageV6: GNSPairsStorageV6__factory.connect(
      addresses.gnsPairsStorageV6,
      signerOrProvider as Signer | Provider
    ),
  };
};

export * from "./utils";
