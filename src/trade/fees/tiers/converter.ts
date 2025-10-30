/**
 * @dev Converters for fee tier data between contract and SDK formats
 * @dev All BigNumber values are normalized to floats with appropriate precision
 */

import { IFeeTiers } from "../../../contracts/types/generated/GNSMultiCollatDiamond";
import {
  FeeTier,
  TraderInfo,
  TraderEnrollment,
  TraderEnrollmentStatus,
  StakingInfo,
} from "./types";

/**
 * @dev Converts contract fee tier data to SDK format
 * @param contractData Contract FeeTier struct
 * @returns Normalized fee tier data
 */
export const convertFeeTier = (
  contractData: IFeeTiers.FeeTierStructOutput
): FeeTier => {
  return {
    feeMultiplier: Number(contractData.feeMultiplier) / 1e3, // Contract uses 1e3 precision
    pointsThreshold: Number(contractData.pointsThreshold), // 0 precision
  };
};

/**
 * @dev Converts array of fee tiers from contract format
 * @param contractDataArray Array of contract FeeTier structs
 * @returns Array of normalized fee tiers
 */
export const convertFeeTierArray = (
  contractDataArray: IFeeTiers.FeeTierStructOutput[]
): FeeTier[] => {
  return contractDataArray.map(convertFeeTier);
};

/**
 * @dev Converts contract trader info to SDK format
 * @param contractData Contract TraderInfo struct
 * @returns Normalized trader info
 */
export const convertTraderInfo = (
  contractData: IFeeTiers.TraderInfoStructOutput
): TraderInfo => {
  return {
    lastDayUpdated: Number(contractData.lastDayUpdated),
    trailingPoints: Number(contractData.trailingPoints) / 1e18, // Points in 1e18 precision
  };
};

/**
 * @dev Converts contract trader enrollment to SDK format
 * @param contractData Contract TraderEnrollment struct
 * @returns Normalized trader enrollment
 */
export const convertTraderEnrollment = (
  contractData: IFeeTiers.TraderEnrollmentStructOutput
): TraderEnrollment => {
  return {
    status: Number(contractData.status) as TraderEnrollmentStatus,
  };
};

/**
 * @dev Converts contract gns staking info to SDK format
 * @param contractData Contract GnsStakingInfo struct
 * @returns Normalized gns staking info
 */
export const convertStakingInfo = (
  contractData: IFeeTiers.GnsStakingInfoStructOutput
): StakingInfo => {
  return {
    stakedGns: Number(contractData.stakedGns) / 1e18,
    stakedVaultGns: Number(contractData.stakedVaultGns) / 1e18,
    bonusAmount: Number(contractData.bonusAmount),
    stakeTimestamp: Number(contractData.stakeTimestamp),
    feeMultiplierCache: Number(contractData.feeMultiplierCache) / 1e3,
  };
};

/**
 * @dev Converts the complete fee tiers configuration from contract format
 * @param tiers Array of volume fee tiers from contract
 * @param groupVolumeMultipliers Array of group volume multipliers
 * @param currentDay Current day from contract
 * @param stakingTiers Array of staking fee tiers from contract
 * @returns Complete fee tiers configuration
 */
export const convertFeeTiersConfig = (
  tiers: IFeeTiers.FeeTierStructOutput[],
  groupVolumeMultipliers: readonly bigint[],
  currentDay: bigint,
  stakingTiers: IFeeTiers.FeeTierStructOutput[]
): {
  tiers: FeeTier[];
  groupVolumeMultipliers: number[];
  currentDay: number;
  stakingTiers: FeeTier[];
} => {
  return {
    tiers: convertFeeTierArray(tiers),
    groupVolumeMultipliers: groupVolumeMultipliers.map(m => Number(m) / 1e3), // 1e3 precision
    currentDay: Number(currentDay),
    stakingTiers: convertFeeTierArray(stakingTiers),
  };
};

/**
 * @dev Converts trader's volume and staking fee tier data from contract format
 * @param traderInfo Trader info from contract
 * @param traderDailyInfo Array of daily points info
 * @param traderEnrollment Enrollment status from contract
 * @param stakingInfo Staking info from contract
 * @returns Complete trader volume and staking fee tier data
 */
export const convertTraderFeeTiersData = (
  traderInfo: IFeeTiers.TraderInfoStructOutput,
  traderDailyInfo: readonly bigint[],
  traderEnrollment: IFeeTiers.TraderEnrollmentStructOutput,
  stakingInfo: IFeeTiers.GnsStakingInfoStructOutput
): {
  traderInfo: TraderInfo;
  dailyPoints: number[];
  traderEnrollment: TraderEnrollment;
  stakingInfo: StakingInfo;
} => {
  return {
    traderInfo: convertTraderInfo(traderInfo),
    dailyPoints: traderDailyInfo.map(points => Number(points) / 1e18), // Points in 1e18 precision
    traderEnrollment: convertTraderEnrollment(traderEnrollment),
    stakingInfo: convertStakingInfo(stakingInfo),
  };
};
