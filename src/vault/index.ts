type GetPendingAccBlockWeightedMarketCap = {
  marketCap: number;
  accBlockWeightedMarketCap: number;
  accBlockWeightedMarketCapLastStored: number;
  marketCapPrecision?: number;
};
export const getPendingAccBlockWeightedMarketCap = (
  currentBlock: number,
  context: GetPendingAccBlockWeightedMarketCap
): number => {
  const {
    marketCap,
    accBlockWeightedMarketCap,
    accBlockWeightedMarketCapLastStored,
    marketCapPrecision,
  } = context;
  return (
    accBlockWeightedMarketCap +
    (currentBlock - accBlockWeightedMarketCapLastStored) /
      Math.max(marketCap * (marketCapPrecision || 1e18), 1)
  );
};
