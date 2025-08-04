import { CounterTradeSettings } from "../../trade/types";

export type LeverageRestrictions = {
  min: number;
  max: number;
};

export type MarketLeverageRestrictions = {
  regular: LeverageRestrictions;
  counterTrade: LeverageRestrictions | null;
};

export type GetMarketLeverageRestrictionsContext = {
  groupMinLeverage: number;
  groupMaxLeverage: number;
  pairMaxLeverage?: number;
  counterTradeSettings?: CounterTradeSettings;
};
