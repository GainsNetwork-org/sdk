import { pairs, corePairIndices } from "../constants";

const CRYPTO = "crypto";

export const MARKET_TYPE = {
  CORE: "core",
  VOLATILE: "volatile",
  REGULAR: "regular",
} as const;

export type MarketType = typeof MARKET_TYPE[keyof typeof MARKET_TYPE];

export const NO_FUTURES_CRYPTO_INDICES = new Set<number>([
  132, 195, 240, 300, 313, 314, 326, 327, 384, 385, 411, 445,
]);

const pairEntries = Object.entries(pairs);

const pairIdToMarketType = new Map<string, MarketType>();

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

// Build pairId lookup
for (let i = 0; i < pairEntries.length; i++) {
  pairIdToMarketType.set(pairEntries[i][0], getMarketType(i));
}

export function getMarketTypeByPairId(pairId: string): MarketType {
  return pairIdToMarketType.get(pairId) ?? MARKET_TYPE.REGULAR;
}
