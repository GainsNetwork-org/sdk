import { getPnlPercent, getTradeValue } from "./index";

describe("PnL Calculations", () => {
  describe("getPnlPercent", () => {
    it("should calculate profit percentage for long position", () => {
      const result = getPnlPercent(100, 110, true, 10);
      expect(result).toBe(100); // 10% price increase * 10x leverage = 100%
    });

    it("should calculate loss percentage for long position", () => {
      const result = getPnlPercent(100, 95, true, 10);
      expect(result).toBe(-50); // 5% price decrease * 10x leverage = -50%
    });

    it("should calculate profit percentage for short position", () => {
      const result = getPnlPercent(100, 90, false, 10);
      expect(result).toBe(100); // 10% price decrease * 10x leverage = 100%
    });

    it("should calculate loss percentage for short position", () => {
      const result = getPnlPercent(100, 105, false, 10);
      expect(result).toBe(-50); // 5% price increase * 10x leverage = -50%
    });

    it("should cap loss at -100%", () => {
      const result = getPnlPercent(100, 80, true, 10);
      expect(result).toBe(-100); // Would be -200% but capped
    });

    it("should handle zero open price", () => {
      const result = getPnlPercent(0, 100, true, 10);
      expect(result).toBe(-100);
    });

    it("should handle low leverage", () => {
      const result = getPnlPercent(100, 110, true, 1);
      expect(result).toBe(10); // 10% price increase * 1x leverage = 10%
    });

    it("should handle high leverage", () => {
      const result = getPnlPercent(100, 101, true, 100);
      expect(result).toBe(100); // 1% price increase * 100x leverage = 100%
    });
  });

  describe("getTradeValue", () => {
    it("should calculate trade value with profit", () => {
      const result = getTradeValue(1000, 50, 10);
      // 1000 + (1000 * 0.5) - 10 = 1490
      expect(result).toBe(1490);
    });

    it("should calculate trade value with loss", () => {
      const result = getTradeValue(1000, -30, 10);
      // 1000 + (1000 * -0.3) - 10 = 690
      expect(result).toBe(690);
    });

    it("should not return negative value", () => {
      const result = getTradeValue(100, -80, 30);
      // 100 + (100 * -0.8) - 30 = -10, but should return 0
      expect(result).toBe(0);
    });

    it("should handle zero fees", () => {
      const result = getTradeValue(1000, 20, 0);
      // 1000 + (1000 * 0.2) - 0 = 1200
      expect(result).toBe(1200);
    });

    it("should handle -100% loss", () => {
      const result = getTradeValue(1000, -100, 0);
      // 1000 + (1000 * -1) - 0 = 0
      expect(result).toBe(0);
    });

    it("should handle fees larger than profit", () => {
      const result = getTradeValue(1000, 5, 100);
      // 1000 + (1000 * 0.05) - 100 = 950
      expect(result).toBe(950);
    });
  });
});
