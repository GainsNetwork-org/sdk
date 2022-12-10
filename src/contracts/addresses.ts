import { ContractAddresses } from "./types";
import addresses from "./addresses.json";

export const getContractAddressesForChain = (
  chainId: number
): ContractAddresses => {
  const _addresses: Record<string, ContractAddresses> = addresses;
  if (!_addresses[chainId]) {
    throw new Error(
      `Unknown chain id (${chainId}). No known contracts have been deployed on this chain.`
    );
  }
  return _addresses[chainId];
};
