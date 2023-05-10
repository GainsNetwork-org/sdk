type GetPendingAccBlockPerMarketCap = {
  marketCap: number;
  accBlockPerMarketCap: number;
  accBlockPerMarketCapLastStored: number;
};
const MIN_BLOCK_PER_MARKET_CAP = 1 / 1e18;
export const getPendingAccBlockWeightedMarketCap = (
  currentBlock: number,
  context: GetPendingAccBlockPerMarketCap
): number => {
  const { marketCap, accBlockPerMarketCap, accBlockPerMarketCapLastStored } =
    context;
  return (
    accBlockPerMarketCap +
    (currentBlock - accBlockPerMarketCapLastStored) /
      Math.max(marketCap, 1 / MIN_BLOCK_PER_MARKET_CAP)
  );
};
