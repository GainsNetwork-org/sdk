/**
 * @dev Market price calculation tests
 */

import { getCurrentMarketPrice } from "./marketPrice";
import { createMarketPriceContext } from "./builder";

describe("Market Price Calculations", () => {
  // Mock contexts for different test scenarios
  const longHeavyContext = createMarketPriceContext(
    1000000, // 1M depth
    1000, // Long OI
    800 // Short OI
  );

  const shortHeavyContext = createMarketPriceContext(
    500000, // 500k depth
    500, // Long OI
    600 // Short OI
  );

  const balancedContext = createMarketPriceContext(
    2000000, // 2M depth
    2000, // Long OI
    2000 // Short OI
  );

  const zeroDepthContext = createMarketPriceContext(
    0, // Zero depth
    1000, // Long OI
    800 // Short OI
  );

  describe("getCurrentMarketPrice", () => {
    it("should calculate market price with positive skew impact", () => {
      const result = getCurrentMarketPrice(0, 1000, longHeavyContext);

      expect(result.oraclePrice).toBe(1000);
      expect(result.skewImpactP).toBeGreaterThan(0); // Long-heavy market = positive impact
      expect(result.marketPrice).toBeGreaterThan(result.oraclePrice);
    });

    it("should calculate market price with negative skew impact", () => {
      const result = getCurrentMarketPrice(1, 1000, shortHeavyContext);

      expect(result.oraclePrice).toBe(1000);
      expect(result.skewImpactP).toBeLessThan(0); // Short-heavy market = negative impact
      expect(result.marketPrice).toBeLessThan(result.oraclePrice);
    });

    it("should handle zero skew impact", () => {
      const result = getCurrentMarketPrice(0, 1000, balancedContext);

      expect(result.oraclePrice).toBe(1000);
      expect(Math.abs(result.skewImpactP)).toBeLessThan(0.01); // Nearly zero impact
      expect(result.marketPrice).toBeCloseTo(result.oraclePrice, 2);
    });

    it("should handle missing skew data gracefully", () => {
      // Use empty context to simulate missing data
      const emptyContext = createMarketPriceContext(0, 0, 0);
      const result = getCurrentMarketPrice(99, 1000, emptyContext);

      expect(result.oraclePrice).toBe(1000);
      expect(result.skewImpactP).toBe(0);
      expect(result.marketPrice).toBe(result.oraclePrice);
    });

    it("should handle zero skew depth", () => {
      const result = getCurrentMarketPrice(0, 1000, zeroDepthContext);

      expect(result.skewImpactP).toBe(0);
      expect(result.marketPrice).toBe(result.oraclePrice);
    });

    it("should correctly apply percentage impact to price", () => {
      const result = getCurrentMarketPrice(0, 2000, longHeavyContext);

      // Market price = oracle price * (1 + impact/100)
      const expectedMarketPrice = 2000 * (1 + result.skewImpactP / 100);
      expect(result.marketPrice).toBeCloseTo(expectedMarketPrice, 6);
    });
  });

  describe("heavily skewed market scenarios", () => {
    it("should return current market price based on existing skew", () => {
      const result = getCurrentMarketPrice(0, 1000, longHeavyContext);

      expect(result.oraclePrice).toBe(1000);
      expect(result.skewImpactP).toBeGreaterThan(0); // Should reflect existing long-heavy skew
      expect(result.marketPrice).toBeGreaterThan(result.oraclePrice);
    });

    it("should reflect existing skew in current market price", () => {
      // Test with a heavily skewed market
      const skewedContext = createMarketPriceContext(
        100000, // Small depth
        5000, // Heavy long skew
        1000 // Short OI
      );

      const result = getCurrentMarketPrice(0, 1000, skewedContext);

      expect(result.skewImpactP).toBeGreaterThan(0); // Long-heavy market
      expect(result.marketPrice).toBeGreaterThan(result.oraclePrice);
      // With heavy skew and small depth, impact should be significant
      expect(result.skewImpactP).toBeGreaterThanOrEqual(2); // At least 2% impact
    });
  });
});
