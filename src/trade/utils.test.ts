import {
  calculatePositionSizeToken,
  calculatePositionSizeCollateral,
} from "./utils";

describe("Trade Utils", () => {
  describe("calculatePositionSizeToken", () => {
    it("should convert collateral to tokens correctly", () => {
      expect(calculatePositionSizeToken(10000, 50000)).toBe(0.2); // $10k at $50k = 0.2 BTC
      expect(calculatePositionSizeToken(1000, 2000)).toBe(0.5); // $1k at $2k = 0.5 ETH
      expect(calculatePositionSizeToken(100, 1)).toBe(100); // $100 at $1 = 100 tokens
    });

    it("should handle decimal prices", () => {
      expect(calculatePositionSizeToken(100, 0.5)).toBe(200); // $100 at $0.50 = 200 tokens
      expect(calculatePositionSizeToken(50, 0.01)).toBe(5000); // $50 at $0.01 = 5000 tokens
    });

    it("should throw error for zero price", () => {
      expect(() => calculatePositionSizeToken(10000, 0)).toThrow(
        "Current price cannot be zero"
      );
    });

    it("should handle very small positions", () => {
      expect(calculatePositionSizeToken(0.01, 50000)).toBeCloseTo(
        0.0000002,
        10
      );
    });
  });

  describe("calculatePositionSizeCollateral", () => {
    it("should convert tokens to collateral correctly", () => {
      expect(calculatePositionSizeCollateral(0.2, 50000)).toBe(10000); // 0.2 BTC at $50k = $10k
      expect(calculatePositionSizeCollateral(0.5, 2000)).toBe(1000); // 0.5 ETH at $2k = $1k
      expect(calculatePositionSizeCollateral(100, 1)).toBe(100); // 100 tokens at $1 = $100
    });

    it("should handle decimal prices", () => {
      expect(calculatePositionSizeCollateral(200, 0.5)).toBe(100); // 200 tokens at $0.50 = $100
      expect(calculatePositionSizeCollateral(5000, 0.01)).toBe(50); // 5000 tokens at $0.01 = $50
    });

    it("should handle zero tokens", () => {
      expect(calculatePositionSizeCollateral(0, 50000)).toBe(0);
    });

    it("should handle very small token amounts", () => {
      expect(calculatePositionSizeCollateral(0.0000002, 50000)).toBeCloseTo(
        0.01,
        10
      );
    });
  });

  describe("round-trip conversions", () => {
    it("should maintain value in round-trip conversions", () => {
      const prices = [1, 10, 100, 1000, 50000, 0.01, 0.5];
      const collaterals = [100, 1000, 10000, 0.01, 50];

      for (const price of prices) {
        for (const collateral of collaterals) {
          const tokens = calculatePositionSizeToken(collateral, price);
          const backToCollateral = calculatePositionSizeCollateral(
            tokens,
            price
          );
          expect(backToCollateral).toBeCloseTo(collateral, 10);
        }
      }
    });
  });
});
