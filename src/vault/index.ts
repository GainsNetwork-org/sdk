type GetPendingAccBlockWeightedMarketCap = {
  marketCap: number;
  accBlockWeightedMarketCap: number;
  accBlockWeightedMarketCapLastStored: number;
};
const MC_PRECISION = 1e18;
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
      Math.max(marketCap * MC_PRECISION, 1)
  );
};
