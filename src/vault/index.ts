type GetPendingAccBlockWeightedMarketCap = {
  marketCap: number;
  accBlockWeightedMarketCap: number;
  accBlockWeightedMarketCapLastStored: number;
};
const MIN_BLOCK_PER_MARKET_CAP = 1 / 1e18;
export const getPendingAccBlockWeightedMarketCap = (
  currentBlock: number,
  context: GetPendingAccBlockWeightedMarketCap
): number => {
  const {
    marketCap,
    accBlockWeightedMarketCap,
    accBlockWeightedMarketCapLastStored,
  } = context;
  return (
    accBlockWeightedMarketCap +
    (currentBlock - accBlockWeightedMarketCapLastStored) /
      Math.max(marketCap, 1 / MIN_BLOCK_PER_MARKET_CAP)
  );
};
