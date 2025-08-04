import { Pair, TradeContainer, TradeType } from "../../trade";
import { TradeContainerBackend } from "./../tradingVariables/backend.types";
import { convertTradesAndLimitOrders } from "./../tradingVariables/converter";
import { TradingVariablesCollateral } from "./../tradingVariables/types";

export type TransformedGlobalTrades = {
  allTrades: Map<string, NestedTrade>;
  allLimitOrders: Map<string, NestedTrade>;
  trades: NestedTrade;
  limitOrders: NestedTrade;
};

export type NestedTrade = Map<number, Map<number, TradeContainer>>;

export const transformGlobalTrades = (
  rawTrades: TradeContainerBackend[],
  pairs: Pair[],
  currentAddress: string | undefined,
  collaterals: TradingVariablesCollateral[]
): TransformedGlobalTrades | undefined => {
  if (rawTrades === undefined) return;

  const r = convertTradesAndLimitOrders(rawTrades, collaterals);

  const returnObject: TransformedGlobalTrades = {
    allTrades: new Map<string, NestedTrade>(),
    allLimitOrders: new Map<string, NestedTrade>(),
    trades: new Map<number, Map<number, TradeContainer>>(),
    limitOrders: new Map<number, Map<number, TradeContainer>>(),
  };

  currentAddress = currentAddress === undefined ? "" : currentAddress;

  const _trades = new Map<number, Map<number, TradeContainer>>();
  const _limitOrders = new Map<number, Map<number, TradeContainer>>();
  const _allTrades = new Map<string, NestedTrade>();
  const _allLimitOrders = new Map<string, NestedTrade>();

  for (let s = 0; s < r.length; s++) {
    if (r[s].trade.tradeType !== TradeType.TRADE) {
      const t = r[s];
      if (_allLimitOrders.get(t.trade.user) === undefined) {
        _allLimitOrders.set(t.trade.user, new Map());
      }

      const traderMap_all = _allLimitOrders.get(t.trade.user);

      if (traderMap_all?.get(t.trade.pairIndex) === undefined) {
        traderMap_all?.set(t.trade.pairIndex, new Map());
      }

      const traderPairMap_all = traderMap_all?.get(t.trade.pairIndex);
      traderPairMap_all?.set(t.trade.index, t);

      if (t.trade.user.toUpperCase() !== currentAddress.toUpperCase()) {
        continue;
      }

      if (_limitOrders.get(t.trade.pairIndex) === undefined) {
        _limitOrders.set(t.trade.pairIndex, new Map());
      }

      const traderPairMap = _limitOrders.get(t.trade.pairIndex);
      traderPairMap?.set(t.trade.index, t);
    } else {
      const t = r[s];
      if (_allTrades.get(t.trade.user) === undefined) {
        _allTrades.set(t.trade.user, new Map());
      }

      const traderMap_all = _allTrades.get(t.trade.user);

      if (traderMap_all?.get(t.trade.pairIndex) === undefined) {
        traderMap_all?.set(t.trade.pairIndex, new Map());
      }

      const traderPairMap_all = traderMap_all?.get(t.trade.pairIndex);
      traderPairMap_all?.set(t.trade.index, t);

      if (t.trade.user.toUpperCase() !== currentAddress.toUpperCase()) {
        continue;
      }

      if (_trades.get(t.trade.pairIndex) === undefined) {
        _trades.set(t.trade.pairIndex, new Map());
      }

      const traderPairMap = _trades.get(t.trade.pairIndex);
      traderPairMap?.set(t.trade.index, t);
    }
  }
  returnObject.trades = _trades;
  returnObject.limitOrders = _limitOrders;
  returnObject.allTrades = _allTrades;
  returnObject.allLimitOrders = _allLimitOrders;

  return returnObject;
};
