type GetPendingAccBlockPerMarketCap = {
  marketCap: number;
  accBlockPerMarketCap: number;
  accBlockPerMarketCapLastStored: number;
};
export const getPendingAccBlockPerMarketCap = (
  currentBlock: number,
  context: GetPendingAccBlockPerMarketCap
): number => {
  const { marketCap, accBlockPerMarketCap, accBlockPerMarketCapLastStored } =
    context;
  return accBlockPerMarketCap + marketCap > 0
    ? (currentBlock - accBlockPerMarketCapLastStored) / marketCap
    : 0;
};
