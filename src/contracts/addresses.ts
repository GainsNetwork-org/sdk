import { CollateralTypes, ContractAddresses } from "./types";
import addresses from "./addresses.json";

export const getContractAddressesForChain = (
  chainId: number,
  collateral: CollateralTypes = CollateralTypes.DAI
): ContractAddresses => {
  const _addresses: Record<
    string,
    Partial<Record<CollateralTypes, ContractAddresses>>
  > = addresses;

  if (!_addresses[chainId]) {
    throw new Error(
      `Unknown chain id (${chainId}). No known contracts have been deployed on this chain.`
    );
  }

  if (!_addresses[chainId][collateral]) {
    throw new Error(
      `Unknown collateral (${collateral}) for chain id (${chainId}). No known contracts have been deployed on this chain.`
    );
  }

  return _addresses[chainId][collateral] as ContractAddresses;
};
