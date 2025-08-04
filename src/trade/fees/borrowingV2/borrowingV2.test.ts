import {
  getPairPendingAccBorrowingFees,
  getTradeBorrowingFeesCollateral,
  borrowingRateToAPR,
  aprToBorrowingRate,
  MAX_BORROWING_RATE_PER_SECOND,
} from "./index";
import { BorrowingFeeV2 } from "./index";

describe("Borrowing V2 Fees", () => {
  const mockParams: BorrowingFeeV2.BorrowingFeeParams = {
    borrowingRatePerSecondP: 31710 / 1e10, // ~100% APR (normalized)
  };

  const mockData: BorrowingFeeV2.PairBorrowingFeeData = {
    accBorrowingFeeP: 1000000000000000000000 / 1e20, // 1e21 (normalized)
    lastBorrowingUpdateTs: 1700000000, // Mock timestamp
  };

  const mockContext: BorrowingFeeV2.GetBorrowingFeeV2Context = {
    borrowingParams: {
      1: mockParams, // pairIndex 1
    },
    borrowingData: {
      1: mockData, // pairIndex 1
    },
  };

  describe("getPairPendingAccBorrowingFees", () => {
    it("should return current acc fee when no time has elapsed", () => {
      const result = getPairPendingAccBorrowingFees(
        mockParams,
        mockData,
        1000000, // 1.0 pair price (1e6)
        mockData.lastBorrowingUpdateTs // same timestamp
      );

      expect(result).toBe(mockData.accBorrowingFeeP);
    });

    it("should calculate correct fee accumulation over time", () => {
      const currentTimestamp = mockData.lastBorrowingUpdateTs + 3600; // 1 hour later
      const currentPairPrice = 1000000; // 1.0 pair price (1e6)

      const result = getPairPendingAccBorrowingFees(
        mockParams,
        mockData,
        currentPairPrice,
        currentTimestamp
      );

      // Expected delta: (31710/1e10) * 3600 * 1000000 = 0.114156
      const expectedDelta =
        mockParams.borrowingRatePerSecondP * 3600 * currentPairPrice;
      const expected = mockData.accBorrowingFeeP + expectedDelta;

      expect(result).toBe(expected);
    });

    it("should handle negative time gracefully", () => {
      const pastTimestamp = mockData.lastBorrowingUpdateTs - 3600; // 1 hour before

      const result = getPairPendingAccBorrowingFees(
        mockParams,
        mockData,
        1000000,
        pastTimestamp
      );

      // Should return current acc fee (no negative time)
      expect(result).toBe(mockData.accBorrowingFeeP);
    });
  });

  describe("getTradeBorrowingFeesCollateral", () => {
    it("should calculate correct trade borrowing fees", () => {
      const input = {
        positionSizeCollateral: 1000000000, // 1000 collateral tokens (1e6 precision)
        openPrice: 1000000, // 1.0 open price (1e6)
        currentPairPrice: 1200000, // 1.2 current price (1e6)
        initialAccBorrowingFeeP: 1000000000000000000000 / 1e20, // 1e21 (normalized)
        currentTimestamp: mockData.lastBorrowingUpdateTs + 3600, // 1 hour later
      };

      const pairContext: BorrowingFeeV2.GetPairBorrowingFeeV2Context = {
        params: mockContext.borrowingParams[1],
        data: mockContext.borrowingData[1],
        currentTimestamp: mockContext.currentTimestamp,
      };

      const result = getTradeBorrowingFeesCollateral(input, pairContext);

      // Calculate expected:
      // 1. Current acc fee = initial + (31710/1e10 * 3600 * 1200000) = 10 + 0.136987200
      // 2. Fee delta = 0.136987200
      // 3. Trade fee = (1000000000 * 0.136987200) / 1000000 / 100 = 136,987.2 collateral tokens

      expect(result).toBeCloseTo(136987.2, 3);
    });

    it("should return 0 when pair data is missing", () => {
      const input = {
        positionSizeCollateral: 1000000000,
        openPrice: 1000000,
        currentPairPrice: 1200000,
        initialAccBorrowingFeeP: 1000000000000000000000 / 1e20, // normalized
      };

      const pairContext: BorrowingFeeV2.GetPairBorrowingFeeV2Context = {
        params: undefined as any, // Missing params
        data: undefined as any, // Missing data
        currentTimestamp: mockContext.currentTimestamp,
      };

      const result = getTradeBorrowingFeesCollateral(input, pairContext);
      expect(result).toBe(0);
    });
  });

  describe("Helper functions", () => {
    it("should convert borrowing rate to APR correctly", () => {
      const rate = 31710 / 1e10; // Normalized rate (~100% APR)
      const apr = borrowingRateToAPR(rate);
      expect(apr).toBeCloseTo(100, 1);
    });

    it("should convert APR to borrowing rate correctly", () => {
      const apr = 100; // 100% APR
      const rate = aprToBorrowingRate(apr);
      expect(rate).toBeCloseTo(31710 / 1e10, 9);
    });

    it("should handle max borrowing rate", () => {
      const maxAPR = borrowingRateToAPR(MAX_BORROWING_RATE_PER_SECOND);
      expect(maxAPR).toBeCloseTo(999997.0992, 1); // Max borrowing rate is ~999997% APR
    });
  });
});
