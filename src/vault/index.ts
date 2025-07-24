type GetPendingAccBlockWeightedMarketCap = {
  marketCap: number;
  accBlockWeightedMarketCap: number;
  accBlockWeightedMarketCapLastStored: number;
  marketCapPrecision?: number;
};
export const getPendingAccBlockWeightedMarketCap = (
  input: { currentBlock: number },
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
    (input.currentBlock - accBlockWeightedMarketCapLastStored) /
      Math.max(marketCap * (marketCapPrecision || 1e18), 1)
  );
};
