/**
 * Tests for depth bands price impact calculation
 */

import { getTradeCumulVolPriceImpactP, CumulVolContext } from "./index";

describe("Depth Bands Price Impact", () => {
  describe("getTradeCumulVolPriceImpactP with depth bands", () => {
    it("should calculate price impact using depth bands when available", () => {
      const context: CumulVolContext = {
        isOpen: true,
        // Depth bands configuration (cumulative percentages)
        pairDepthBands: {
          above: {
            totalDepthUsd: 1000000, // $1M total depth
            bands: [
              0.1,
              0.2,
              0.3,
              0.4,
              0.5, // First 5 bands: cumulative to 50%
              0.55,
              0.6,
              0.65,
              0.7,
              0.75, // Next 5: cumulative to 75%
              0.8,
              0.82,
              0.84,
              0.86,
              0.88, // Getting tighter
              0.9,
              0.91,
              0.92,
              0.93,
              0.94, // Even tighter
              0.95,
              0.96,
              0.97,
              0.98,
              0.99, // Almost there
              0.995,
              0.997,
              0.998,
              0.999,
              1.0, // Final bands to 100%
            ],
          },
          below: {
            totalDepthUsd: 1000000,
            bands: [
              0.1, 0.2, 0.3, 0.4, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.82,
              0.84, 0.86, 0.88, 0.9, 0.91, 0.92, 0.93, 0.94, 0.95, 0.96, 0.97,
              0.98, 0.99, 0.995, 0.997, 0.998, 0.999, 1.0,
            ],
          },
        },
        depthBandsMapping: {
          bands: [
            0.0001,
            0.0002,
            0.0003,
            0.0005,
            0.0008, // First 5: 0.01% to 0.08%
            0.0013,
            0.002,
            0.003,
            0.0045,
            0.0065, // Next 5: accelerating
            0.009,
            0.012,
            0.0155,
            0.0195,
            0.024, // Mid bands
            0.029,
            0.0345,
            0.0405,
            0.047,
            0.054, // Higher impact
            0.0615,
            0.0695,
            0.078,
            0.087,
            0.0965, // Getting steep
            0.1065,
            0.117,
            0.128,
            0.1395,
            0.15, // Max 15% impact
          ],
        },
        // Add OI data for cumulative volume calculation
        oiWindowsSettings: {
          windowsDuration: 3600,
          windowsCount: 10,
          startTs: Math.floor(Date.now() / 1000) - 36000,
        },
        oiWindows: {}, // Empty OI means 0 cumulative volume
        protectionCloseFactor: 1, // No protection factor
        cumulativeFactor: 1, // No cumulative factor
      };

      // Test small trade (1% of depth = $10k)
      const smallImpact = getTradeCumulVolPriceImpactP(
        "",
        0,
        true, // long
        10000, // $10k
        false,
        true, // open
        0,
        context
      );

      // Small trade in first band should have very small impact
      expect(smallImpact).toBeGreaterThan(0);
      expect(smallImpact).toBeLessThan(0.0001); // Less than 0.01%

      // Test medium trade (25% of depth = $250k)
      const mediumImpact = getTradeCumulVolPriceImpactP(
        "",
        0,
        true,
        250000, // $250k
        false,
        true,
        0,
        context
      );

      // Medium trade crosses multiple bands
      // With cumulative bands and proper calculation, 25% depth gives 0.0000625
      expect(mediumImpact).toBeGreaterThan(0.00005);
      expect(mediumImpact).toBeLessThan(0.0001); // Less than 0.01%

      // Test large trade (50% of depth = $500k)
      const largeImpact = getTradeCumulVolPriceImpactP(
        "",
        0,
        true,
        500000, // $500k
        false,
        true,
        0,
        context
      );

      // Large trade uses half the liquidity
      // With cumulative bands and proper calculation, 50% depth gives 0.00015
      expect(largeImpact).toBeGreaterThan(0.0001);
      expect(largeImpact).toBeLessThan(0.002); // Less than 0.2%

      // Verify impacts are increasing with trade size
      expect(mediumImpact).toBeGreaterThan(smallImpact);
      expect(largeImpact).toBeGreaterThan(mediumImpact);
    });

    it("should return 0 when depth bands are not configured", () => {
      const context: CumulVolContext = {
        isOpen: true,
        pairDepthBands: {
          above: undefined,
          below: undefined,
        },
        depthBandsMapping: {
          bands: new Array(30).fill(0),
        },
      };

      const impact = getTradeCumulVolPriceImpactP(
        "",
        0,
        true,
        100000,
        false,
        true,
        0,
        context
      );

      expect(impact).toBe(0);
    });

    it("should use correct direction bands (above for long open)", () => {
      const context: CumulVolContext = {
        isOpen: true,
        pairDepthBands: {
          above: {
            totalDepthUsd: 1000000,
            bands: new Array(30).fill(0).map((_, i) => (i + 1) / 30),
          },
          below: {
            totalDepthUsd: 500000, // Different depth below
            bands: new Array(30).fill(0).map((_, i) => (i + 1) / 30),
          },
        },
        depthBandsMapping: {
          bands: new Array(30).fill(0).map((_, i) => (i + 1) * 0.005), // 0.5% to 15%
        },
      };

      // Long open should use above bands (1M depth)
      const longOpenImpact = getTradeCumulVolPriceImpactP(
        "",
        0,
        true, // long
        100000,
        false,
        true, // open
        0,
        context
      );

      // Short open should use below bands (500k depth)
      const shortOpenImpact = getTradeCumulVolPriceImpactP(
        "",
        0,
        false, // short
        100000,
        false,
        true, // open
        0,
        context
      );

      // Same trade size but different depths should give different impacts
      // Note: with signed calculation, short open returns negative impact
      expect(Math.abs(shortOpenImpact)).toBeGreaterThan(
        Math.abs(longOpenImpact)
      );
    });

    it("should return 0 when depth bands not provided", () => {
      const context: CumulVolContext = {
        isOpen: true,
        oiWindowsSettings: {
          windowsDuration: 3600,
          windowsCount: 10,
          startTs: Math.floor(Date.now() / 1000) - 36000,
        },
        oiWindows: new Array(10).fill(0).reduce((acc, _, i) => {
          acc[i.toString()] = {
            oiLongUsd: 1000000,
            oiShortUsd: 1000000,
          };
          return acc;
        }, {} as any),
        cumulativeFactor: 1,
        protectionCloseFactor: 1,
      };

      const impact = getTradeCumulVolPriceImpactP(
        "",
        0,
        true,
        50000,
        false,
        true,
        0,
        context
      );

      // Should return 0 without depth bands (no fallback to legacy)
      expect(impact).toBe(0);
    });
  });
});
