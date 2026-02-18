import { pairs, corePairIndices } from "../constants";

const CRYPTO = "crypto";

export const MARKET_TYPE = {
  CORE: "core",
  VOLATILE: "volatile",
  REGULAR: "regular",
} as const;

export type MarketType = typeof MARKET_TYPE[keyof typeof MARKET_TYPE];

export const NO_FUTURES_CRYPTO_INDICES = new Set<number>([]);

const pairEntries = Object.entries(pairs);

export function getMarketType(pairIndex: number): MarketType {
  if (corePairIndices.has(pairIndex)) {
    return MARKET_TYPE.CORE;
  }

  const entry = pairEntries[pairIndex];
  if (!entry) {
    return MARKET_TYPE.REGULAR;
  }

  const assetClass = entry[1];
  if (assetClass !== CRYPTO) {
    return MARKET_TYPE.REGULAR;
  }

  if (NO_FUTURES_CRYPTO_INDICES.has(pairIndex)) {
    return MARKET_TYPE.REGULAR;
  }

  return MARKET_TYPE.VOLATILE;
}
