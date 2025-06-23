import {
  transformGlobalTrades,
  ITransformedGlobalTradingVariables,
} from "./index";
import { TradeContainerBackend } from "../tradingVariables/backend.types";
import fs from "fs";
import path from "path";
import { Pair } from "../../trade";
import { TradingVariablesCollateral } from "../tradingVariables/types";

describe("transformGlobalTrades", () => {
  it("should transform sample.json without throwing errors", () => {
    const samplePath = path.join(__dirname, "sample.json");
    const rawData = JSON.parse(
      fs.readFileSync(samplePath, "utf-8")
    ) as TradeContainerBackend[];

    // Mock data for required parameters
    const mockPairs: Pair[] = [];
    const mockCurrentAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f8b2dc";
    const mockCollaterals: TradingVariablesCollateral[] = [
      {
        collateral: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
        collateralIndex: 1,
        symbol: "DAI",
        isActive: true,
        gToken: {
          address: "0x91993f2101cc758D0dEB7279d41e880F7dEFe827",
          currentBalanceCollateral: "0",
          marketCap: "0",
          maxBalanceCollateral: "0",
        },
        prices: {
          collateralPriceUsd: 1,
          gnsPriceCollateral: 1,
          gnsPriceUsd: 1,
        },
        collateralConfig: {
          collateral: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
          isActive: true,
          precision: 1,
          precisionDelta: 0,
          decimals: 18,
        },
        pairBorrowingFees: [],
        groupBorrowingFees: [],
        pairBorrowingFeesV2: { params: [], data: [] },
        pairFundingFees: { globalParams: [], params: [], data: [] },
        pairOis: [],
        pairSkewDepths: {},
        tradingPairs: new Map(),
      },
      // Add mock collateral for index 2
      {
        collateral: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
        collateralIndex: 2,
        symbol: "WETH",
        isActive: true,
        gToken: {
          address: "0x0000000000000000000000000000000000000000",
          currentBalanceCollateral: "0",
          marketCap: "0",
          maxBalanceCollateral: "0",
        },
        prices: {
          collateralPriceUsd: 1,
          gnsPriceCollateral: 1,
          gnsPriceUsd: 1,
        },
        collateralConfig: {
          collateral: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
          isActive: true,
          precision: 1,
          precisionDelta: 0,
          decimals: 18,
        },
        pairBorrowingFees: [],
        groupBorrowingFees: [],
        pairBorrowingFeesV2: { params: [], data: [] },
        pairFundingFees: { globalParams: [], params: [], data: [] },
        pairOis: [],
        pairSkewDepths: {},
        tradingPairs: new Map(),
      },
      // Add mock collateral for index 3 (USDC)
      {
        collateral: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8",
        collateralIndex: 3,
        symbol: "USDC",
        isActive: true,
        gToken: {
          address: "0x0000000000000000000000000000000000000000",
          currentBalanceCollateral: "0",
          marketCap: "0",
          maxBalanceCollateral: "0",
        },
        prices: {
          collateralPriceUsd: 1,
          gnsPriceCollateral: 1,
          gnsPriceUsd: 1,
        },
        collateralConfig: {
          collateral: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8",
          isActive: true,
          precision: 1,
          precisionDelta: 0,
          decimals: 6, // USDC has 6 decimals
        },
        pairBorrowingFees: [],
        groupBorrowingFees: [],
        pairBorrowingFeesV2: { params: [], data: [] },
        pairFundingFees: { globalParams: [], params: [], data: [] },
        pairOis: [],
        pairSkewDepths: {},
        tradingPairs: new Map(),
      },
      // Add mock collateral for index 4 (GNS)
      {
        collateral: "0xE5417Af564e4bFDA1c483642db72007871397896",
        collateralIndex: 4,
        symbol: "GNS",
        isActive: true,
        gToken: {
          address: "0x0000000000000000000000000000000000000000",
          currentBalanceCollateral: "0",
          marketCap: "0",
          maxBalanceCollateral: "0",
        },
        prices: {
          collateralPriceUsd: 1,
          gnsPriceCollateral: 1,
          gnsPriceUsd: 1,
        },
        collateralConfig: {
          collateral: "0xE5417Af564e4bFDA1c483642db72007871397896",
          isActive: true,
          precision: 1,
          precisionDelta: 0,
          decimals: 18,
        },
        pairBorrowingFees: [],
        groupBorrowingFees: [],
        pairBorrowingFeesV2: { params: [], data: [] },
        pairFundingFees: { globalParams: [], params: [], data: [] },
        pairOis: [],
        pairSkewDepths: {},
        tradingPairs: new Map(),
      },
    ];

    let result: ITransformedGlobalTradingVariables | undefined;
    expect(() => {
      result = transformGlobalTrades(
        rawData,
        mockPairs,
        mockCurrentAddress,
        mockCollaterals
      );
    }).not.toThrow();

    // Basic structure validation
    expect(result).toBeDefined();
    if (result) {
      expect(result.allTrades).toBeInstanceOf(Map);
      expect(result.allLimitOrders).toBeInstanceOf(Map);
      expect(result.trades).toBeInstanceOf(Map);
      expect(result.limitOrders).toBeInstanceOf(Map);
    }
  });

  it("should handle undefined rawTrades", () => {
    const result = transformGlobalTrades(undefined as any, [], "0x123", []);

    expect(result).toBeUndefined();
  });
});
