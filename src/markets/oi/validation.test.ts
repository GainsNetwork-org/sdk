import { UnifiedPairOi } from "./types";
import {
  withinMaxPairOi,
  calculateDynamicOi,
  getRemainingOiCapacity,
  withinMaxGroupOiDynamic,
  getGroupDynamicOi,
  validateOiLimits,
} from "./validation";
import * as BorrowingFee from "../../trade/fees/borrowing/types";

describe("OI Validation", () => {
  const mockPairOi: UnifiedPairOi = {
    maxCollateral: 1000000, // 1M max OI
    beforeV10Collateral: { long: 100000, short: 50000 },
    collateral: { long: 150000, short: 75000 }, // Static post-v10
    token: { long: 200000, short: 100000 }, // 200k/100k tokens
  };

  const collateralPrice = 1.5; // $1.50 per token

  describe("withinMaxPairOi", () => {
    it("should return true when position is within limits", () => {
      const result = withinMaxPairOi(mockPairOi, true, 50000, collateralPrice);
      expect(result).toBe(true);
    });

    it("should return false when position exceeds limits", () => {
      const result = withinMaxPairOi(
        mockPairOi,
        true,
        800000, // Would exceed 1M limit
        collateralPrice
      );
      expect(result).toBe(false);
    });

    it("should return true when maxCollateral is 0 (unlimited)", () => {
      const unlimitedOi = { ...mockPairOi, maxCollateral: 0 };
      const result = withinMaxPairOi(
        unlimitedOi,
        true,
        10000000, // 10M
        collateralPrice
      );
      expect(result).toBe(true);
    });

    it("should check short side correctly", () => {
      const result = withinMaxPairOi(
        mockPairOi,
        false, // short
        50000,
        collateralPrice
      );
      expect(result).toBe(true);
    });
  });

  describe("calculateDynamicOi", () => {
    it("should calculate long dynamic OI correctly", () => {
      // beforeV10: 100000 + token: 200000 * 1.5 = 400000
      const result = calculateDynamicOi(mockPairOi, collateralPrice, true);
      expect(result).toBe(400000);
    });

    it("should calculate short dynamic OI correctly", () => {
      // beforeV10: 50000 + token: 100000 * 1.5 = 200000
      const result = calculateDynamicOi(mockPairOi, collateralPrice, false);
      expect(result).toBe(200000);
    });

    it("should handle price of 1", () => {
      const result = calculateDynamicOi(mockPairOi, 1, true);
      expect(result).toBe(300000); // 100000 + 200000 * 1
    });
  });

  describe("getRemainingOiCapacity", () => {
    it("should calculate remaining long capacity", () => {
      // Max: 1M, current long: 400k, remaining: 600k
      const result = getRemainingOiCapacity(mockPairOi, collateralPrice, true);
      expect(result).toBe(600000);
    });

    it("should calculate remaining short capacity", () => {
      // Max: 1M, current short: 200k, remaining: 800k
      const result = getRemainingOiCapacity(mockPairOi, collateralPrice, false);
      expect(result).toBe(800000);
    });

    it("should return 0 when already at capacity", () => {
      const atCapacity = {
        ...mockPairOi,
        beforeV10Collateral: { long: 700000, short: 50000 },
      };
      // Dynamic long: 700k + 200k * 1.5 = 1M (at capacity)
      const result = getRemainingOiCapacity(atCapacity, collateralPrice, true);
      expect(result).toBe(0);
    });

    it("should return 0 when over capacity", () => {
      const overCapacity = {
        ...mockPairOi,
        beforeV10Collateral: { long: 800000, short: 50000 },
      };
      // Dynamic long: 800k + 200k * 1.5 = 1.1M (over capacity)
      const result = getRemainingOiCapacity(
        overCapacity,
        collateralPrice,
        true
      );
      expect(result).toBe(0);
    });

    it("should return 0 for unlimited capacity", () => {
      const unlimited = { ...mockPairOi, maxCollateral: 0 };
      const result = getRemainingOiCapacity(unlimited, collateralPrice, true);
      expect(result).toBe(0); // 0 indicates unlimited
    });
  });

  describe("withinMaxGroupOiDynamic", () => {
    const mockGroups: BorrowingFee.Group[] = [
      {
        feePerBlock: 0.01,
        accFeeLong: 100,
        accFeeShort: 80,
        accLastUpdatedBlock: 1000,
        oi: { long: 500000, short: 400000, max: 2000000 },
        feeExponent: 2,
      },
    ];

    const mockPairs: BorrowingFee.Pair[] = [
      {
        groups: [
          {
            groupIndex: 0,
            block: 1000,
            initialAccFeeLong: 0,
            initialAccFeeShort: 0,
            prevGroupAccFeeLong: 0,
            prevGroupAccFeeShort: 0,
            pairAccFeeLong: 0,
            pairAccFeeShort: 0,
          },
        ],
        feePerBlock: 0.01,
        accFeeLong: 50,
        accFeeShort: 40,
        accLastUpdatedBlock: 1000,
        oi: { long: 200000, short: 150000, max: 1000000 },
        feeExponent: 2,
      },
      {
        groups: [
          {
            groupIndex: 0,
            block: 1000,
            initialAccFeeLong: 0,
            initialAccFeeShort: 0,
            prevGroupAccFeeLong: 0,
            prevGroupAccFeeShort: 0,
            pairAccFeeLong: 0,
            pairAccFeeShort: 0,
          },
        ],
        feePerBlock: 0.01,
        accFeeLong: 60,
        accFeeShort: 45,
        accLastUpdatedBlock: 1000,
        oi: { long: 300000, short: 250000, max: 1500000 },
        feeExponent: 2,
      },
    ];

    const mockPairOis: UnifiedPairOi[] = [mockPairOi, mockPairOi];

    it("should return true when within group limits", () => {
      const result = withinMaxGroupOiDynamic(0, true, 50000, collateralPrice, {
        groups: mockGroups,
        pairs: mockPairs,
        pairOis: mockPairOis,
      });
      expect(result).toBe(true);
    });

    it("should return false when exceeding group limits", () => {
      const result = withinMaxGroupOiDynamic(
        0,
        true,
        1500000, // Would exceed group limit
        collateralPrice,
        {
          groups: mockGroups,
          pairs: mockPairs,
          pairOis: mockPairOis,
        }
      );
      expect(result).toBe(false);
    });

    it("should handle unlimited group OI", () => {
      const unlimitedGroups = [
        { ...mockGroups[0], oi: { ...mockGroups[0].oi, max: 0 } },
      ];
      const result = withinMaxGroupOiDynamic(
        0,
        true,
        10000000,
        collateralPrice,
        {
          groups: unlimitedGroups,
          pairs: mockPairs,
          pairOis: mockPairOis,
        }
      );
      expect(result).toBe(true);
    });

    it("should return false for invalid pair index", () => {
      const result = withinMaxGroupOiDynamic(
        99, // Invalid index
        true,
        50000,
        collateralPrice,
        {
          groups: mockGroups,
          pairs: mockPairs,
          pairOis: mockPairOis,
        }
      );
      expect(result).toBe(false);
    });
  });

  describe("getGroupDynamicOi", () => {
    const mockPairs: BorrowingFee.Pair[] = [
      {
        groups: [
          {
            groupIndex: 0,
            block: 1000,
            initialAccFeeLong: 0,
            initialAccFeeShort: 0,
            prevGroupAccFeeLong: 0,
            prevGroupAccFeeShort: 0,
            pairAccFeeLong: 0,
            pairAccFeeShort: 0,
          },
        ],
        feePerBlock: 0.01,
        accFeeLong: 50,
        accFeeShort: 40,
        accLastUpdatedBlock: 1000,
        oi: { long: 200000, short: 150000, max: 1000000 },
        feeExponent: 2,
      },
      {
        groups: [
          {
            groupIndex: 0,
            block: 1000,
            initialAccFeeLong: 0,
            initialAccFeeShort: 0,
            prevGroupAccFeeLong: 0,
            prevGroupAccFeeShort: 0,
            pairAccFeeLong: 0,
            pairAccFeeShort: 0,
          },
        ],
        feePerBlock: 0.01,
        accFeeLong: 60,
        accFeeShort: 45,
        accLastUpdatedBlock: 1000,
        oi: { long: 300000, short: 250000, max: 1500000 },
        feeExponent: 2,
      },
      {
        groups: [
          {
            groupIndex: 1,
            block: 1000,
            initialAccFeeLong: 0,
            initialAccFeeShort: 0,
            prevGroupAccFeeLong: 0,
            prevGroupAccFeeShort: 0,
            pairAccFeeLong: 0,
            pairAccFeeShort: 0,
          },
        ], // Different group
        feePerBlock: 0.01,
        accFeeLong: 70,
        accFeeShort: 55,
        accLastUpdatedBlock: 1000,
        oi: { long: 400000, short: 350000, max: 2000000 },
        feeExponent: 2,
      },
    ];

    const mockPairOis: UnifiedPairOi[] = [mockPairOi, mockPairOi, mockPairOi];

    it("should calculate group dynamic OI correctly", () => {
      const result = getGroupDynamicOi(0, collateralPrice, {
        pairs: mockPairs,
        pairOis: mockPairOis,
      });

      // Group 0 has pairs 0 and 1
      // Each pair: long 400k, short 200k (dynamic)
      expect(result.long).toBe(800000); // 2 * 400k
      expect(result.short).toBe(400000); // 2 * 200k
      expect(result.total).toBe(1200000);
    });

    it("should handle empty group", () => {
      const result = getGroupDynamicOi(99, collateralPrice, {
        pairs: mockPairs,
        pairOis: mockPairOis,
      });

      expect(result.long).toBe(0);
      expect(result.short).toBe(0);
      expect(result.total).toBe(0);
    });
  });

  describe("validateOiLimits", () => {
    const mockGroups: BorrowingFee.Group[] = [
      {
        feePerBlock: 0.01,
        accFeeLong: 100,
        accFeeShort: 80,
        accLastUpdatedBlock: 1000,
        oi: { long: 500000, short: 400000, max: 2000000 },
        feeExponent: 2,
      },
    ];

    const mockPairs: BorrowingFee.Pair[] = [
      {
        groups: [
          {
            groupIndex: 0,
            block: 1000,
            initialAccFeeLong: 0,
            initialAccFeeShort: 0,
            prevGroupAccFeeLong: 0,
            prevGroupAccFeeShort: 0,
            pairAccFeeLong: 0,
            pairAccFeeShort: 0,
          },
        ],
        feePerBlock: 0.01,
        accFeeLong: 50,
        accFeeShort: 40,
        accLastUpdatedBlock: 1000,
        oi: { long: 200000, short: 150000, max: 1000000 },
        feeExponent: 2,
      },
    ];

    const mockPairOis: UnifiedPairOi[] = [mockPairOi];

    it("should validate both pair and group limits", () => {
      const result = validateOiLimits(0, true, 50000, collateralPrice, {
        groups: mockGroups,
        pairs: mockPairs,
        pairOis: mockPairOis,
      });

      expect(result.withinPairLimit).toBe(true);
      expect(result.withinGroupLimit).toBe(true);
      expect(result.pairRemainingCapacity).toBe(600000);
      expect(result.groupRemainingCapacity).toBeGreaterThan(0);
    });

    it("should handle invalid pair index", () => {
      const result = validateOiLimits(99, true, 50000, collateralPrice, {
        groups: mockGroups,
        pairs: mockPairs,
        pairOis: mockPairOis,
      });

      expect(result.withinPairLimit).toBe(false);
      expect(result.withinGroupLimit).toBe(false);
      expect(result.pairRemainingCapacity).toBe(0);
      expect(result.groupRemainingCapacity).toBe(0);
    });
  });
});
