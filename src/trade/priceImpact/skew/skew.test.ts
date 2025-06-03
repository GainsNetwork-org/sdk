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
  normalizeSkewDepth,
  createSkewPriceImpactContext,
  isValidSkewDepth,
} from "./converter";
import { PairOiToken, SkewPriceImpactContext, TradeSkewParams } from "./types";

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
        oiLongToken: 500,
        oiShortToken: 800,
      };
      expect(getNetSkewToken(pairOi)).toBe(-300);
    });

    it("should return 0 when balanced", () => {
      const pairOi: PairOiToken = {
        oiLongToken: 1000,
        oiShortToken: 1000,
      };
      expect(getNetSkewToken(pairOi)).toBe(0);
    });
  });

  describe("position size conversions", () => {
    it("should convert collateral to tokens", () => {
      const collateral = 10000; // $10,000
      const price = 50000; // BTC at $50k
      expect(calculatePositionSizeToken(collateral, price)).toBe(0.2); // 0.2 BTC
    });

    it("should convert tokens to collateral", () => {
      const tokens = 0.2; // 0.2 BTC
      const price = 50000; // BTC at $50k
      expect(calculatePositionSizeCollateral(tokens, price)).toBe(10000);
    });

    it("should throw error for zero price", () => {
      expect(() => calculatePositionSizeToken(10000, 0)).toThrow(
        "Current price cannot be zero"
      );
    });
  });

  describe("getTradeSkewDirection", () => {
    it("should return true for long open (increases positive skew)", () => {
      expect(getTradeSkewDirection(true, true)).toBe(true);
    });

    it("should return true for short close (increases positive skew)", () => {
      expect(getTradeSkewDirection(false, false)).toBe(true);
    });

    it("should return false for short open (increases negative skew)", () => {
      expect(getTradeSkewDirection(false, true)).toBe(false);
    });

    it("should return false for long close (increases negative skew)", () => {
      expect(getTradeSkewDirection(true, false)).toBe(false);
    });
  });

  describe("calculateSkewPriceImpactP", () => {
    it("should return 0 when depth is 0", () => {
      const result = calculateSkewPriceImpactP(1000, 100, 0, true);
      expect(result).toBe(0);
    });

    it("should calculate positive impact when increasing skew", () => {
      const existingSkew = 1000; // Long heavy
      const tradeSize = 200;
      const depth = 10000;
      const increasesSkew = true;

      // (1000 + 200/2) / 10000 * 100 / 2 = 11/100 * 100 / 2 = 5.5%
      const result = calculateSkewPriceImpactP(
        existingSkew,
        tradeSize,
        depth,
        increasesSkew
      );
      expect(result).toBe(5.5);
    });

    it("should calculate negative impact when reducing skew", () => {
      const existingSkew = 1000; // Long heavy
      const tradeSize = 200;
      const depth = 10000;
      const increasesSkew = false; // Closing long or opening short

      // (1000 + (-200)/2) / 10000 * 100 / 2 = 9/100 * 100 / 2 = 4.5%
      const result = calculateSkewPriceImpactP(
        existingSkew,
        tradeSize,
        depth,
        increasesSkew
      );
      expect(result).toBe(4.5);
    });

    it("should handle negative existing skew", () => {
      const existingSkew = -800; // Short heavy
      const tradeSize = 200;
      const depth = 10000;
      const increasesSkew = true; // Opening short

      // (-800 + 200/2) / 10000 * 100 / 2 = -7/100 * 100 / 2 = -3.5%
      const result = calculateSkewPriceImpactP(
        existingSkew,
        tradeSize,
        depth,
        increasesSkew
      );
      expect(result).toBeCloseTo(-3.5, 6);
    });
  });

  describe("getTradeSkewPriceImpact", () => {
    const context: SkewPriceImpactContext = {
      skewDepths: {
        0: { 1: 100000 }, // ETH/USD on collateral 0
      },
      pairOiTokens: {
        0: {
          1: {
            oiLongToken: 120,
            oiShortToken: 80,
          },
        },
      },
    };

    it("should calculate complete skew price impact", () => {
      const result = getTradeSkewPriceImpact(context, {
        collateralIndex: 0,
        pairIndex: 1,
        long: true,
        open: true,
        positionSizeToken: 10,
      });

      expect(result.netSkewToken).toBe(40); // 120 - 80
      expect(result.tradeDirection).toBe("increase");
      // (40 + 10/2) / 100000 * 100 / 2 = 0.0225%
      expect(result.priceImpactP).toBeCloseTo(0.0225, 6);
    });

    it("should throw error for missing skew depth", () => {
      expect(() =>
        getTradeSkewPriceImpact(context, {
          collateralIndex: 0,
          pairIndex: 999,
          long: true,
          open: true,
          positionSizeToken: 10,
        })
      ).toThrow("Missing skew depth for collateral 0 pair 999");
    });

    it("should throw error for missing OI data", () => {
      expect(() =>
        getTradeSkewPriceImpact(context, {
          collateralIndex: 999,
          pairIndex: 1,
          long: true,
          open: true,
          positionSizeToken: 10,
        })
      ).toThrow("Missing skew depth for collateral 999 pair 1");
    });
  });

  describe("getTradeSkewPriceImpactWithChecks", () => {
    const context: SkewPriceImpactContext = {
      skewDepths: {
        0: { 1: 100000 },
      },
      pairOiTokens: {
        0: {
          1: {
            oiLongToken: 100,
            oiShortToken: 100,
          },
        },
      },
    };

    it("should return 0 for pre-v10 trades", () => {
      const params: TradeSkewParams = {
        collateralIndex: 0,
        pairIndex: 1,
        long: true,
        open: true,
        positionSizeCollateral: 10000,
        currentPrice: 2000,
        contractsVersion: 9,
      };

      const result = getTradeSkewPriceImpactWithChecks(params, context);
      expect(result).toBe(0);
    });

    it("should return 0 for counter trades", () => {
      const params: TradeSkewParams = {
        collateralIndex: 0,
        pairIndex: 1,
        long: true,
        open: true,
        positionSizeCollateral: 10000,
        currentPrice: 2000,
        contractsVersion: 10,
        isCounterTrade: true,
      };

      const result = getTradeSkewPriceImpactWithChecks(params, context);
      expect(result).toBe(0);
    });

    it("should calculate impact for v10+ non-counter trades", () => {
      const params: TradeSkewParams = {
        collateralIndex: 0,
        pairIndex: 1,
        long: true,
        open: true,
        positionSizeCollateral: 10000,
        currentPrice: 2000,
        contractsVersion: 10,
        isCounterTrade: false,
      };

      const result = getTradeSkewPriceImpactWithChecks(params, context);
      // Position size in tokens = 10000 / 2000 = 5
      // Net skew = 0, trade size = 5
      // (0 + 5/2) / 100000 * 100 / 2 = 0.00125%
      expect(result).toBeCloseTo(0.00125, 6);
    });
  });

  describe("calculatePartialSizeToken", () => {
    it("should calculate proportional token size for partial operations", () => {
      const originalCollateral = 10000;
      const deltaCollateral = 2500; // 25% partial close
      const originalTokens = 0.2;

      const result = calculatePartialSizeToken(
        originalCollateral,
        deltaCollateral,
        originalTokens
      );
      expect(result).toBe(0.05); // 25% of 0.2
    });

    it("should return 0 when original size is 0", () => {
      const result = calculatePartialSizeToken(0, 100, 0.1);
      expect(result).toBe(0);
    });
  });

  describe("Converters", () => {
    describe("convertPairOiToken", () => {
      it("should convert contract OI token data", () => {
        const contractData = {
          oiLongToken: BigInt(100e18),
          oiShortToken: BigInt(80e18),
          __placeholder: 0,
        };

        const result = convertPairOiToken(contractData);
        expect(result.oiLongToken).toBe(100);
        expect(result.oiShortToken).toBe(80);
      });
    });

    describe("convertPairOiCollateral", () => {
      it("should convert with 18 decimals (DAI)", () => {
        const contractData = {
          oiLongCollateral: BigInt(1000e18),
          oiShortCollateral: BigInt(800e18),
          __placeholder: 0,
        };

        const result = convertPairOiCollateral(contractData, 18);
        expect(result.oiLongCollateral).toBe(1000);
        expect(result.oiShortCollateral).toBe(800);
      });

      it("should convert with 6 decimals (USDC)", () => {
        const contractData = {
          oiLongCollateral: BigInt(1000e6),
          oiShortCollateral: BigInt(800e6),
          __placeholder: 0,
        };

        const result = convertPairOiCollateral(contractData, 6);
        expect(result.oiLongCollateral).toBe(1000);
        expect(result.oiShortCollateral).toBe(800);
      });
    });

    describe("normalizeSkewDepth", () => {
      it("should normalize depth with 18 decimals", () => {
        const depth = BigInt(100000e18);
        const result = normalizeSkewDepth(depth, 18);
        expect(result).toBeCloseTo(100000, 6);
      });

      it("should normalize depth with 6 decimals", () => {
        const depth = BigInt(100000e6);
        const result = normalizeSkewDepth(depth, 6);
        expect(result).toBe(100000);
      });
    });

    describe("createSkewPriceImpactContext", () => {
      it("should create context from arrays", () => {
        const collateralIndices = [0, 0, 1];
        const pairIndices = [1, 2, 1];
        const skewDepths = [100000, 200000, 150000];
        const pairOiTokens: PairOiToken[] = [
          { oiLongToken: 100, oiShortToken: 80 },
          { oiLongToken: 200, oiShortToken: 220 },
          { oiLongToken: 150, oiShortToken: 150 },
        ];

        const context = createSkewPriceImpactContext(
          collateralIndices,
          pairIndices,
          skewDepths,
          pairOiTokens
        );

        expect(context.skewDepths[0][1]).toBe(100000);
        expect(context.skewDepths[0][2]).toBe(200000);
        expect(context.skewDepths[1][1]).toBe(150000);
        expect(context.pairOiTokens[0][1]).toEqual(pairOiTokens[0]);
        expect(context.pairOiTokens[0][2]).toEqual(pairOiTokens[1]);
        expect(context.pairOiTokens[1][1]).toEqual(pairOiTokens[2]);
      });

      it("should throw error for mismatched array lengths", () => {
        expect(() =>
          createSkewPriceImpactContext([0], [1, 2], [100], [])
        ).toThrow("All input arrays must have the same length");
      });
    });

    describe("isValidSkewDepth", () => {
      it("should validate depth within bounds", () => {
        expect(isValidSkewDepth(100000)).toBe(true);
        expect(isValidSkewDepth(0)).toBe(true);
        expect(isValidSkewDepth(1e12)).toBe(true);
      });

      it("should reject negative depths by default", () => {
        expect(isValidSkewDepth(-100)).toBe(false);
      });

      it("should use custom bounds", () => {
        expect(isValidSkewDepth(50, 100, 1000)).toBe(false);
        expect(isValidSkewDepth(500, 100, 1000)).toBe(true);
        expect(isValidSkewDepth(2000, 100, 1000)).toBe(false);
      });
    });
  });
});
