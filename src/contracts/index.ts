import type { Signer } from "ethers";
import type { Provider } from "@ethersproject/providers";
import { getContractAddressesForChain } from "./addresses";
import {
  GFarmTradingStorageV5__factory,
  GNSPairInfosV6_1__factory,
  GNSPairsStorageV6__factory,
  GTokenOpenPnlFeed__factory,
  GNSNftRewardsV6_3_1__factory,
  GNSBorrowingFees__factory,
  GNSTradingCallbacksV6_4__factory,
  GTokenV6_3_2__factory,
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
    gnsPairInfosV6_1: GNSPairInfosV6_1__factory.connect(
      addresses.gnsPairInfosV6_1,
      signerOrProvider as Signer | Provider
    ),
    gnsPairsStorageV6: GNSPairsStorageV6__factory.connect(
      addresses.gnsPairsStorageV6,
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
      addresses.gnsBorrowingFeesV6_3_2,
      signerOrProvider as Signer | Provider
    ),
    gnsTradingCallbacks: GNSTradingCallbacksV6_4__factory.connect(
      addresses.gnsTradingCallbacksV6_3_2,
      signerOrProvider as Signer | Provider
    ),
    gDai: GTokenV6_3_2__factory.connect(
      addresses.gDai,
      signerOrProvider as Signer | Provider
    ),
  };
};

export * from "./utils";
export * from "./addresses";
