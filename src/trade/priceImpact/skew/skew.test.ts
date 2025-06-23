import {
  getNetSkewToken,
  getTradeSkewDirection,
  calculateSkewPriceImpactP,
  getTradeSkewPriceImpact,
  getTradeSkewPriceImpactWithChecks,
  calculatePartialSizeToken,
} from "./index";
import {
  calculatePositionSizeToken,
  calculatePositionSizeCollateral,
} from "../../utils";
import {
  convertPairOiToken,
  convertPairOiCollateral,
  convertSkewDepth,
  convertPairSkewDepths,
} from "./converter";
import { PairOiToken, SkewPriceImpactContext, TradeSkewParams } from "./types";
import { ContractsVersion } from "../../../contracts/types";

describe("Skew Price Impact", () => {
  describe("getNetSkewToken", () => {
    it("should calculate positive net skew when long > short", () => {
      const pairOi: PairOiToken = {
        oiLongToken: 1000,
        oiShortToken: 600,
      };
      expect(getNetSkewToken(pairOi)).toBe(400);
    });

    it("should calculate negative net skew when short > long", () => {
      const pairOi: PairOiToken = {
        oiLongToken: 400,
        oiShortToken: 700,
      };
      expect(getNetSkewToken(pairOi)).toBe(-300);
    });

    it("should return 0 when long equals short", () => {
      const pairOi: PairOiToken = {
        oiLongToken: 500,
        oiShortToken: 500,
      };
      expect(getNetSkewToken(pairOi)).toBe(0);
    });
  });

  describe("getTradeSkewDirection", () => {
    it("should return true for opening long (increases positive skew)", () => {
      expect(getTradeSkewDirection(true, true)).toBe(true);
    });

    it("should return true for closing short (increases positive skew)", () => {
      expect(getTradeSkewDirection(false, false)).toBe(true);
    });

    it("should return false for opening short (increases negative skew)", () => {
      expect(getTradeSkewDirection(false, true)).toBe(false);
    });

    it("should return false for closing long (increases negative skew)", () => {
      expect(getTradeSkewDirection(true, false)).toBe(false);
    });
  });

  describe("calculateSkewPriceImpactP", () => {
    it("should calculate positive impact when trade increases skew", () => {
      const impact = calculateSkewPriceImpactP(
        100, // existing skew
        50, // trade size
        1000, // depth
        true // increases skew
      );
      // ((100 + 50/2) / 1000) * 100 / 2 = 6.25%
      expect(impact).toBe(6.25);
    });

    it("should calculate negative impact when trade decreases skew", () => {
      const impact = calculateSkewPriceImpactP(
        100, // existing skew
        50, // trade size
        1000, // depth
        false // decreases skew
      );
      // ((100 - 50/2) / 1000) * 100 / 2 = 3.75%
      expect(impact).toBe(3.75);
    });

    it("should return 0 when depth is 0", () => {
      const impact = calculateSkewPriceImpactP(100, 50, 0, true);
      expect(impact).toBe(0);
    });

    it("should handle negative existing skew", () => {
      const impact = calculateSkewPriceImpactP(
        -100, // negative existing skew
        50,
        1000,
        false // trade in same direction as skew
      );
      // ((-100 - 50/2) / 1000) * 100 / 2 = -6.25%
      expect(impact).toBe(-6.25);
    });

    it("should handle large trades relative to depth", () => {
      const impact = calculateSkewPriceImpactP(1000, 2000, 1000, true);
      // ((1000 + 2000/2) / 1000) * 100 / 2 = 100%
      expect(impact).toBe(100);
    });

    it("should calculate current market skew impact with size 0", () => {
      const existingSkew = 200; // 200 token net long skew
      const depth = 10000;
      const impact = calculateSkewPriceImpactP(
        existingSkew,
        0, // Size 0 to get current market impact
        depth,
        true // Direction doesn't matter for size 0
      );
      // (200 + 0/2) / 10000 * 100 / 2 = 1%
      expect(impact).toBe(1);
    });
  });

  describe("Position size utilities", () => {
    describe("calculatePositionSizeToken", () => {
      it("should calculate token amount from collateral", () => {
        const collateralAmount = 100;
        const price = 50;
        expect(calculatePositionSizeToken(collateralAmount, price)).toBe(2);
      });

      it("should handle decimal amounts", () => {
        const collateralAmount = 100;
        const price = 33.33;
        expect(calculatePositionSizeToken(collateralAmount, price)).toBeCloseTo(
          3.0003,
          4
        );
      });
    });

    describe("calculatePositionSizeCollateral", () => {
      it("should calculate collateral amount from tokens", () => {
        const tokenAmount = 2;
        const price = 50;
        expect(calculatePositionSizeCollateral(tokenAmount, price)).toBe(100);
      });
    });
  });

  describe("getTradeSkewPriceImpact", () => {
    const context: SkewPriceImpactContext = {
      skewDepth: 100000, // ETH/USD
      pairOiToken: {
        oiLongToken: 120,
        oiShortToken: 80,
      },
    };

    it("should calculate complete skew price impact", () => {
      const result = getTradeSkewPriceImpact(
        {
          collateralIndex: 0,
          pairIndex: 1,
          long: true,
          open: true,
          positionSizeToken: 10,
        },
        context
      );

      expect(result.netSkewToken).toBe(40); // 120 - 80
      expect(result.tradeDirection).toBe("increase");
      // (40 + 10/2) / 100000 * 100 / 2 = 0.0225%
      expect(result.priceImpactP).toBeCloseTo(0.0225, 6);
    });

    it("should handle zero skew depth gracefully", () => {
      const zeroDepthContext: SkewPriceImpactContext = {
        skewDepth: 0,
        pairOiToken: {
          oiLongToken: 100,
          oiShortToken: 100,
        },
      };

      const result = getTradeSkewPriceImpact(
        {
          collateralIndex: 0,
          pairIndex: 1,
          long: true,
          open: true,
          positionSizeToken: 10,
        },
        zeroDepthContext
      );

      expect(result.priceImpactP).toBe(0);
      expect(result.tradeDirection).toBe("neutral");
    });
  });

  describe("getTradeSkewPriceImpactWithChecks", () => {
    const context: SkewPriceImpactContext = {
      skewDepth: 10000,
      pairOiToken: {
        oiLongToken: 100,
        oiShortToken: 100,
      },
    };

    it("should return 0 for pre-v10 trades", () => {
      const params: TradeSkewParams = {
        collateralIndex: 0,
        pairIndex: 1,
        long: true,
        open: true,
        positionSizeCollateral: 1000,
        currentPrice: 50,
        contractsVersion: ContractsVersion.BEFORE_V9_2,
      };

      expect(getTradeSkewPriceImpactWithChecks(params, context)).toBe(0);
    });

    it("should return 0 for counter trades", () => {
      const params: TradeSkewParams = {
        collateralIndex: 0,
        pairIndex: 1,
        long: true,
        open: true,
        positionSizeCollateral: 1000,
        currentPrice: 50,
        contractsVersion: ContractsVersion.V10,
        isCounterTrade: true,
      };

      expect(getTradeSkewPriceImpactWithChecks(params, context)).toBe(0);
    });

    it("should calculate impact for v10+ non-counter trades", () => {
      const params: TradeSkewParams = {
        collateralIndex: 0,
        pairIndex: 1,
        long: true,
        open: true,
        positionSizeCollateral: 1000,
        currentPrice: 50,
        contractsVersion: ContractsVersion.V10,
      };

      const impact = getTradeSkewPriceImpactWithChecks(params, context);
      // Position size in tokens: 1000 / 50 = 20
      // Net skew: 100 - 100 = 0
      // Impact: (0 + 20/2) / 10000 * 100 / 2 = 0.05%
      expect(impact).toBeCloseTo(0.05, 6);
    });
  });

  describe("calculatePartialSizeToken", () => {
    it("should calculate partial token size proportionally", () => {
      const originalCollateral = 1000;
      const deltaCollateral = 250; // 25% reduction
      const originalToken = 20;

      const result = calculatePartialSizeToken(
        originalCollateral,
        deltaCollateral,
        originalToken
      );

      expect(result).toBe(5); // 25% of 20
    });

    it("should return 0 for zero original collateral", () => {
      const result = calculatePartialSizeToken(0, 100, 20);
      expect(result).toBe(0);
    });

    it("should handle full position", () => {
      const result = calculatePartialSizeToken(1000, 1000, 20);
      expect(result).toBe(20);
    });
  });

  describe("Converter functions", () => {
    describe("convertPairOiToken", () => {
      it("should convert contract OI to normalized values", () => {
        const contractData = {
          oiLongToken: BigInt("1000000000000000000000"), // 1000 * 1e18
          oiShortToken: BigInt("500000000000000000000"), // 500 * 1e18
        };

        const result = convertPairOiToken(contractData as any);
        expect(result.oiLongToken).toBe(1000);
        expect(result.oiShortToken).toBe(500);
      });
    });

    describe("convertSkewDepth", () => {
      it("should convert depth from 1e18 to float", () => {
        const depth = "100000000000000000000"; // 100 * 1e18
        expect(convertSkewDepth(depth)).toBe(100);
      });

      it("should handle zero depth", () => {
        expect(convertSkewDepth("0")).toBe(0);
      });
    });

    describe("convertPairSkewDepths", () => {
      it("should convert array of depths to object mapping", () => {
        const depths = [
          "100000000000000000000", // pair 0: 100
          "0", // pair 1: 0 (skipped)
          "200000000000000000000", // pair 2: 200
        ];

        const result = convertPairSkewDepths(depths);
        expect(result).toEqual({
          0: 100,
          2: 200,
        });
      });

      it("should return empty object for empty array", () => {
        expect(convertPairSkewDepths([])).toEqual({});
      });
    });
  });
});
