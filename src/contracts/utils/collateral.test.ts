import { ChainId, CollateralTypes } from "../types";
import { getCollateralDecimalsForCollateralType, getCollateralDecimalsForChain } from "./collateral";

describe("Collateral Utilities", () => {
  describe("getCollateralDecimalsForCollateralType", () => {
    it("should return correct decimals for Polygon collaterals", () => {
      expect(
        getCollateralDecimalsForCollateralType(ChainId.POLYGON, CollateralTypes.DAI)
      ).toBe(18);
      expect(
        getCollateralDecimalsForCollateralType(ChainId.POLYGON, CollateralTypes.ETH)
      ).toBe(18);
      expect(
        getCollateralDecimalsForCollateralType(ChainId.POLYGON, CollateralTypes.USDC)
      ).toBe(6);
    });

    it("should return correct decimals for Arbitrum collaterals", () => {
      expect(
        getCollateralDecimalsForCollateralType(ChainId.ARBITRUM, CollateralTypes.DAI)
      ).toBe(18);
      expect(
        getCollateralDecimalsForCollateralType(ChainId.ARBITRUM, CollateralTypes.USDC)
      ).toBe(6);
      expect(
        getCollateralDecimalsForCollateralType(ChainId.ARBITRUM, CollateralTypes.GNS)
      ).toBe(18);
    });

    it("should return correct decimals for Base USDC", () => {
      expect(
        getCollateralDecimalsForCollateralType(ChainId.BASE, CollateralTypes.USDC)
      ).toBe(6);
    });

    it("should throw error for unsupported collateral", () => {
      expect(() =>
        getCollateralDecimalsForCollateralType(ChainId.BASE, CollateralTypes.DAI)
      ).toThrow("Collateral DAI not configured for chain 8453");
    });
  });

  describe("getCollateralDecimalsForChain", () => {
    it("should return correct decimals for collateral indices", () => {
      // Polygon
      expect(getCollateralDecimalsForChain(137, [1, 2, 3])).toEqual([18, 18, 6]);
      
      // Arbitrum
      expect(getCollateralDecimalsForChain(42161, [1, 2, 3, 4])).toEqual([18, 18, 6, 18]);
      
      // Base
      expect(getCollateralDecimalsForChain(8453, [1])).toEqual([6]);
    });

    it("should return default 18 for unknown indices", () => {
      expect(getCollateralDecimalsForChain(137, [99])).toEqual([18]);
      expect(getCollateralDecimalsForChain(999, [1, 2])).toEqual([18, 18]);
    });
  });
});
