import {
  CollateralTypes,
  ContractAddresses,
  ContractAddressList,
} from "./types";
import addresses from "./addresses.json";

export const getContractAddressesForChain = (
  chainId: number,
  collateral: CollateralTypes = CollateralTypes.DAI
): ContractAddresses => {
  const _addresses: ContractAddressList = addresses;

  if (!_addresses[chainId]) {
    throw new Error(
      `Unknown chain id (${chainId}). No known contracts have been deployed on this chain.`
    );
  }

  if (!_addresses[chainId][collateral]) {
    throw new Error(
      `Unknown collateral (${collateral}) for chain id (${chainId}). No known contracts have been deployed for this collateral.`
    );
  }

  return {
    ..._addresses[chainId]["global"],
    ..._addresses[chainId][collateral],
  } as ContractAddresses;
};

export const getCollateralByAddressForChain = (
  chainId: number,
  address: string
): CollateralTypes => {
  const _addresses: ContractAddressList = addresses;

  if (!_addresses[chainId]) {
    throw new Error(
      `Unknown chain id (${chainId}). No known contracts have been deployed on this chain.`
    );
  }

  for (const collateral in CollateralTypes) {
    if (
      Object.values(
        _addresses[chainId][collateral as CollateralTypes] || {}
      ).some(contract => contract.toLowerCase() === address.toLowerCase())
    )
      return collateral as CollateralTypes;
  }

  throw new Error(
    `Unable to find collateral for address (${address}) and chain id (${chainId}). No known contracts match requested address.`
  );
};
