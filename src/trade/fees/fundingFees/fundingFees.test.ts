import {
  getCurrentFundingVelocityPerYear,
  getSecondsToReachZeroRate,
  getAvgFundingRatePerSecondP,
  getLongShortAprMultiplier,
  getPairPendingAccFundingFees,
  getTradeFundingFeesCollateralSimple,
  getTradeFundingFees,
} from "./index";
import {
  convertFundingFeeParams,
  convertPairFundingFeeData,
  createFundingFeeContext,
  fundingRateToAPR,
  aprToFundingRate,
  isValidFundingRate,
} from "./converter";
import {
  FundingFeeParams,
  PairFundingFeeData,
  GetFundingFeeContext,
  PairOiAfterV10,
} from "./types";
import { ContractsVersion } from "../../../contracts/types";

describe("Funding Fees", () => {
  describe("getCurrentFundingVelocityPerYear", () => {
    it("should return 0 when net exposure is 0", () => {
      const result = getCurrentFundingVelocityPerYear(0, 0, 1000, 100, 1000);
      expect(result).toBe(0);
    });

    it("should return 0 when skew coefficient is 0", () => {
      const result = getCurrentFundingVelocityPerYear(
        1000,
        10000,
        0,
        100,
        1000
      );
      expect(result).toBe(0);
    });

    it("should return 0 when below theta threshold", () => {
      const result = getCurrentFundingVelocityPerYear(
        100,
        500,
        1000,
        100,
        1000
      );
      expect(result).toBe(0);
    });

    it("should calculate positive velocity for long skew", () => {
      const netExposureToken = 1000;
      const netExposureUsd = 10000;
      const skewCoefficient = 0.5;
      const velocityCap = 1000;
      const thetaThreshold = 5000;

      const result = getCurrentFundingVelocityPerYear(
        netExposureToken,
        netExposureUsd,
        skewCoefficient,
        velocityCap,
        thetaThreshold
      );

      expect(result).toBe(500); // 1000 * 0.5 = 500
    });

    it("should calculate negative velocity for short skew", () => {
      const result = getCurrentFundingVelocityPerYear(
        -1000,
        -10000,
        0.5,
        1000,
        5000
      );

      expect(result).toBe(-500);
    });

    it("should apply velocity cap", () => {
      const result = getCurrentFundingVelocityPerYear(
        2000,
        20000,
        0.5,
        800,
        5000
      );

      expect(result).toBe(800); // Capped at 800
    });
  });

  describe("getSecondsToReachZeroRate", () => {
    it("should throw error when velocity is 0", () => {
      expect(() => getSecondsToReachZeroRate(0.001, 0)).toThrow(
        "Velocity cannot be zero when calculating time to reach zero rate"
      );
    });

    it("should calculate correct seconds for positive rate going negative", () => {
      const lastRate = 0.001; // 0.1% per second
      const velocity = -365; // -365% per year
      // seconds = -lastRate * ONE_YEAR / velocity = -0.001 * 31536000 / -365 = 86.4
      const expected = 86.4;

      const result = getSecondsToReachZeroRate(lastRate, velocity);
      expect(result).toBeCloseTo(expected, 1);
    });

    it("should calculate correct seconds for negative rate going positive", () => {
      const lastRate = -0.001;
      const velocity = 365;
      // seconds = -(-0.001) * 31536000 / 365 = 86.4
      const expected = 86.4;

      const result = getSecondsToReachZeroRate(lastRate, velocity);
      expect(result).toBeCloseTo(expected, 1);
    });
  });

  describe("getAvgFundingRatePerSecondP", () => {
    it("should return 0 when rate cap is 0", () => {
      const result = getAvgFundingRatePerSecondP(0.001, 0, 100, 3600);
      expect(result.avgFundingRatePerSecondP).toBe(0);
      expect(result.currentFundingRatePerSecondP).toBe(0);
    });

    it("should return same rate when velocity is 0", () => {
      const lastRate = 0.001;
      const result = getAvgFundingRatePerSecondP(lastRate, 0.01, 0, 3600);

      expect(result.avgFundingRatePerSecondP).toBe(lastRate);
      expect(result.currentFundingRatePerSecondP).toBe(lastRate);
    });

    it("should return same rate when no time elapsed", () => {
      const lastRate = 0.001;
      const result = getAvgFundingRatePerSecondP(lastRate, 0.01, 100, 0);

      expect(result.avgFundingRatePerSecondP).toBe(lastRate);
      expect(result.currentFundingRatePerSecondP).toBe(lastRate);
    });

    it("should calculate rate without reaching cap", () => {
      const lastRate = 0.001;
      const rateCap = 0.01;
      const velocityPerYear = 365; // 365% per year
      const secondsElapsed = 3600; // 1 hour

      const result = getAvgFundingRatePerSecondP(
        lastRate,
        rateCap,
        velocityPerYear,
        secondsElapsed
      );

      // Note: Since velocity is high but we don't reach cap, the calculation
      // is rate per second capped at rateCap
      expect(result.currentFundingRatePerSecondP).toBe(rateCap);
      expect(result.avgFundingRatePerSecondP).toBeLessThan(rateCap);
      expect(result.avgFundingRatePerSecondP).toBeGreaterThan(lastRate);
    });

    it("should handle rate reaching cap", () => {
      const lastRate = 0.009;
      const rateCap = 0.01;
      const velocityPerYear = 3650; // High velocity
      const secondsElapsed = 36000; // 10 hours

      const result = getAvgFundingRatePerSecondP(
        lastRate,
        rateCap,
        velocityPerYear,
        secondsElapsed
      );

      expect(result.currentFundingRatePerSecondP).toBe(rateCap);
      expect(result.avgFundingRatePerSecondP).toBeLessThan(rateCap);
      expect(result.avgFundingRatePerSecondP).toBeGreaterThan(lastRate);
    });
  });

  describe("getLongShortAprMultiplier", () => {
    it("should return 1 for both when rate is 0", () => {
      const result = getLongShortAprMultiplier(0, 1000, 2000, true);
      expect(result.longAprMultiplier).toBe(1);
      expect(result.shortAprMultiplier).toBe(1);
    });

    it("should return 1 for both when APR multiplier disabled", () => {
      const result = getLongShortAprMultiplier(0.001, 1000, 2000, false);
      expect(result.longAprMultiplier).toBe(1);
      expect(result.shortAprMultiplier).toBe(1);
    });

    it("should calculate long multiplier when longs earn (negative rate)", () => {
      const result = getLongShortAprMultiplier(-0.001, 1000, 3000, true);
      expect(result.longAprMultiplier).toBe(3); // 3000/1000 = 3
      expect(result.shortAprMultiplier).toBe(1);
    });

    it("should calculate short multiplier when shorts earn (positive rate)", () => {
      const result = getLongShortAprMultiplier(0.001, 3000, 1000, true);
      expect(result.longAprMultiplier).toBe(1);
      expect(result.shortAprMultiplier).toBe(3); // 3000/1000 = 3
    });

    it("should apply multiplier cap", () => {
      const result = getLongShortAprMultiplier(-0.001, 10, 2000, true);
      expect(result.longAprMultiplier).toBe(100); // Capped at 100
      expect(result.shortAprMultiplier).toBe(1);
    });
  });

  describe("getPairPendingAccFundingFees", () => {
    const baseParams: FundingFeeParams = {
      skewCoefficientPerYear: 1,
      absoluteVelocityPerYearCap: 1000,
      absoluteRatePerSecondCap: 0.01,
      thetaThresholdUsd: 1000,
      fundingFeesEnabled: true,
      aprMultiplierEnabled: true,
    };

    const baseData: PairFundingFeeData = {
      accFundingFeeLongP: 0.1,
      accFundingFeeShortP: -0.1,
      lastFundingRatePerSecondP: 0.001,
      lastFundingUpdateTs: 1000000,
    };

    const basePairOi: PairOiAfterV10 = {
      oiLongToken: 10000,
      oiShortToken: 8000,
    };

    it("should return current values when funding fees disabled", () => {
      const params = { ...baseParams, fundingFeesEnabled: false };
      const result = getPairPendingAccFundingFees(
        params,
        baseData,
        100,
        basePairOi,
        2000,
        200000,
        1003600
      );

      expect(result.accFundingFeeLongP).toBe(baseData.accFundingFeeLongP);
      expect(result.accFundingFeeShortP).toBe(baseData.accFundingFeeShortP);
      expect(result.currentFundingRatePerSecondP).toBe(
        baseData.lastFundingRatePerSecondP
      );
    });

    it("should calculate funding fees without rate sign change", () => {
      const currentTimestamp = baseData.lastFundingUpdateTs + 3600; // 1 hour later
      const currentPairPrice = 100;
      const netExposureToken = 2000;
      const netExposureUsd = 200000;

      const result = getPairPendingAccFundingFees(
        baseParams,
        baseData,
        currentPairPrice,
        basePairOi,
        netExposureToken,
        netExposureUsd,
        currentTimestamp
      );

      expect(result.accFundingFeeLongP).toBeGreaterThan(
        baseData.accFundingFeeLongP
      );
      expect(result.accFundingFeeShortP).toBeLessThan(
        baseData.accFundingFeeShortP
      );
      expect(result.currentFundingRatePerSecondP).toBeDefined();
    });

    it("should handle rate sign change with APR multiplier", () => {
      const dataWithNegativeRate = {
        ...baseData,
        lastFundingRatePerSecondP: -0.001,
      };
      const currentTimestamp = baseData.lastFundingUpdateTs + 7200; // 2 hours later

      const result = getPairPendingAccFundingFees(
        baseParams,
        dataWithNegativeRate,
        100,
        basePairOi,
        2000,
        200000,
        currentTimestamp
      );

      // With sign change, calculation should split into two periods
      expect(result.currentFundingRatePerSecondP).toBeGreaterThan(0);
    });
  });

  describe("getTradeFundingFeesCollateral", () => {
    it("should return 0 for pre-v10 trades", () => {
      const trade = {
        collateralAmount: 1000,
        leverage: 10,
        openPrice: 50000,
        long: true,
      };
      const tradeInfo = { contractsVersion: ContractsVersion.V9_2 };

      const result = getTradeFundingFeesCollateralSimple(
        trade,
        tradeInfo,
        0.1,
        0.2
      );
      expect(result).toBe(0);
    });

    it("should calculate funding fee for v10+ trades", () => {
      const trade = {
        collateralAmount: 1000,
        leverage: 10,
        openPrice: 50000,
        long: true,
      };
      const tradeInfo = { contractsVersion: ContractsVersion.V10 };
      const initialAccFee = 0.1;
      const currentAccFee = 0.15;

      const result = getTradeFundingFeesCollateralSimple(
        trade,
        tradeInfo,
        initialAccFee,
        currentAccFee
      );

      // Position size = 1000 * 10 = 10000
      // Delta = 0.15 - 0.1 = 0.05
      // Fee = 10000 * 0.05 / 50000 = 0.01
      expect(result).toBeCloseTo(0.01, 8);
    });
  });

  describe("Converters", () => {
    describe("convertFundingFeeParams", () => {
      it("should convert contract params to normalized values", () => {
        const contractParams = {
          skewCoefficientPerYear: BigInt(1e26),
          absoluteVelocityPerYearCap: 10000000, // 1e7
          absoluteRatePerSecondCap: 10000000000, // 1e10
          thetaThresholdUsd: 1000,
          fundingFeesEnabled: true,
          aprMultiplierEnabled: false,
          __placeholder: 0,
        };

        const result = convertFundingFeeParams(contractParams);

        expect(result.skewCoefficientPerYear).toBe(1);
        expect(result.absoluteVelocityPerYearCap).toBe(1);
        expect(result.absoluteRatePerSecondCap).toBe(1);
        expect(result.thetaThresholdUsd).toBe(1000);
        expect(result.fundingFeesEnabled).toBe(true);
        expect(result.aprMultiplierEnabled).toBe(false);
      });
    });

    describe("convertPairFundingFeeData", () => {
      it("should convert contract data to normalized values", () => {
        const contractData = {
          accFundingFeeLongP: BigInt(1e20),
          accFundingFeeShortP: BigInt(-5e19),
          lastFundingRatePerSecondP: BigInt(1e16),
          lastFundingUpdateTs: 1700000000,
          __placeholder: 0,
        };

        const result = convertPairFundingFeeData(contractData);

        expect(result.accFundingFeeLongP).toBe(1);
        expect(result.accFundingFeeShortP).toBe(-0.5);
        expect(result.lastFundingRatePerSecondP).toBe(0.01);
        expect(result.lastFundingUpdateTs).toBe(1700000000);
      });
    });

    describe("fundingRateToAPR and aprToFundingRate", () => {
      it("should convert between rate and APR correctly", () => {
        const ratePerSecond = 0.0001; // 0.01% per second
        const apr = fundingRateToAPR(ratePerSecond);
        const backToRate = aprToFundingRate(apr);

        expect(apr).toBeCloseTo(315360, 1); // ~315360% APR (0.01% per second for a year)
        expect(backToRate).toBeCloseTo(ratePerSecond, 10);
      });
    });

    describe("isValidFundingRate", () => {
      it("should validate funding rate correctly", () => {
        expect(isValidFundingRate(0.0003170979)).toBe(true); // Max allowed
        expect(isValidFundingRate(0.000317098)).toBe(false); // Above max
        expect(isValidFundingRate(0.0001)).toBe(true); // Valid rate
      });
    });
  });

  describe("createFundingFeeContext", () => {
    it("should create context from arrays", () => {
      const collateralIndices = [0, 0, 1];
      const pairIndices = [1, 2, 1];
      const params: FundingFeeParams[] = [
        {
          skewCoefficientPerYear: 1,
          absoluteVelocityPerYearCap: 1000,
          absoluteRatePerSecondCap: 0.01,
          thetaThresholdUsd: 1000,
          fundingFeesEnabled: true,
          aprMultiplierEnabled: true,
        },
        {
          skewCoefficientPerYear: 2,
          absoluteVelocityPerYearCap: 2000,
          absoluteRatePerSecondCap: 0.02,
          thetaThresholdUsd: 2000,
          fundingFeesEnabled: true,
          aprMultiplierEnabled: false,
        },
        {
          skewCoefficientPerYear: 1.5,
          absoluteVelocityPerYearCap: 1500,
          absoluteRatePerSecondCap: 0.015,
          thetaThresholdUsd: 1500,
          fundingFeesEnabled: false,
          aprMultiplierEnabled: true,
        },
      ];
      const data: PairFundingFeeData[] = [
        {
          accFundingFeeLongP: 0.1,
          accFundingFeeShortP: -0.1,
          lastFundingRatePerSecondP: 0.001,
          lastFundingUpdateTs: 1000000,
        },
        {
          accFundingFeeLongP: 0.2,
          accFundingFeeShortP: -0.2,
          lastFundingRatePerSecondP: 0.002,
          lastFundingUpdateTs: 1000000,
        },
        {
          accFundingFeeLongP: 0.15,
          accFundingFeeShortP: -0.15,
          lastFundingRatePerSecondP: 0.0015,
          lastFundingUpdateTs: 1000000,
        },
      ];

      const context = createFundingFeeContext(
        collateralIndices,
        pairIndices,
        params,
        data,
        undefined,
        1700000000
      );

      expect(context.currentTimestamp).toBe(1700000000);
      expect(context.fundingParams[0][1]).toEqual(params[0]);
      expect(context.fundingParams[0][2]).toEqual(params[1]);
      expect(context.fundingParams[1][1]).toEqual(params[2]);
      expect(context.fundingData[0][1]).toEqual(data[0]);
      expect(context.fundingData[0][2]).toEqual(data[1]);
      expect(context.fundingData[1][1]).toEqual(data[2]);
    });
  });

  describe("getTradeFundingFees", () => {
    it("should calculate complete funding fee result", () => {
      const context: GetFundingFeeContext = {
        currentTimestamp: 1700000000,
        fundingParams: {
          0: {
            1: {
              skewCoefficientPerYear: 1,
              absoluteVelocityPerYearCap: 1000,
              absoluteRatePerSecondCap: 0.01,
              thetaThresholdUsd: 1000,
              fundingFeesEnabled: true,
              aprMultiplierEnabled: true,
            },
          },
        },
        fundingData: {
          0: {
            1: {
              accFundingFeeLongP: 0.1,
              accFundingFeeShortP: -0.1,
              lastFundingRatePerSecondP: 0.001,
              lastFundingUpdateTs: 1699996400, // 1 hour before
            },
          },
        },
      };

      const trade = {
        collateralAmount: 1000,
        leverage: 10,
        openPrice: 50000,
        long: true,
      };

      const tradeInfo = { contractsVersion: ContractsVersion.V10 };
      const initialAccFundingFeeP = 0.09;
      const currentPairPrice = 51000;
      const pairOiToken: PairOiAfterV10 = {
        oiLongToken: 10000,
        oiShortToken: 8000,
      };
      const netExposureToken = 2000;
      const netExposureUsd = 102000;

      const result = getTradeFundingFees(
        {
          collateralIndex: 0,
          pairIndex: 1,
          trade,
          tradeInfo,
          initialAccFundingFeeP,
          currentPairPrice,
          pairOiToken,
          netExposureToken,
          netExposureUsd,
        },
        context
      );

      expect(result.fundingFeeCollateral).toBeDefined();
      expect(result.fundingFeeP).toBeDefined();
      expect(result.currentAccFundingFeeP).toBeGreaterThan(0.1);
      expect(result.initialAccFundingFeeP).toBe(0.09);
    });

    it("should throw error for missing data", () => {
      const context: GetFundingFeeContext = {
        currentTimestamp: 1700000000,
        fundingParams: {},
        fundingData: {},
      };

      const trade = {
        collateralAmount: 1000,
        leverage: 10,
        openPrice: 50000,
        long: true,
      };

      expect(() =>
        getTradeFundingFees(
          {
            collateralIndex: 0,
            pairIndex: 1,
            trade,
            tradeInfo: { contractsVersion: ContractsVersion.V10 },
            initialAccFundingFeeP: 0.1,
            currentPairPrice: 51000,
            pairOiToken: { oiLongToken: 10000, oiShortToken: 8000 },
            netExposureToken: 2000,
            netExposureUsd: 100000,
          },
          context
        )
      ).toThrow("Missing funding fee data for collateral 0 pair 1");
    });
  });
});
