import { transformGlobalTradingVariables } from "./index";
import { GlobalTradingVariablesBackend } from "./backend.types";
import { TransformedGlobalTradingVariables } from "./types";
import * as fs from "fs";
import * as path from "path";

describe("transformGlobalTradingVariables", () => {
  it("should transform sample.json without throwing errors", () => {
    // Load the sample data
    const samplePath = path.join(__dirname, "sample.json");
    const rawData = JSON.parse(
      fs.readFileSync(samplePath, "utf-8")
    ) as GlobalTradingVariablesBackend;

    // Call the transform function - we're just checking it doesn't throw
    let result: TransformedGlobalTradingVariables | undefined;
    expect(() => {
      result = transformGlobalTradingVariables(rawData);
    }).not.toThrow();

    // Basic structure validation
    expect(result).toBeDefined();
    expect(result).toHaveProperty("globalTradingVariables");
    expect(result).toHaveProperty("pairIndexes");
    expect(result).toHaveProperty("blockNumber");
    expect(result).toHaveProperty("l1BlockNumber");

    // Log basic info about the transformed data
    console.log("Transform completed successfully");
    console.log(`Number of collaterals: ${result?.globalTradingVariables.collaterals?.length || 0}`);
    console.log(`Number of pairs: ${result?.globalTradingVariables.pairs?.length || 0}`);
    console.log(`Number of groups: ${result?.globalTradingVariables.groups?.length || 0}`);
    console.log(`Block number: ${result?.blockNumber || "undefined"}`);
    console.log(`L1 block number: ${result?.l1BlockNumber || "undefined"}`);
  });
});