/**
 * @dev Consolidated OI types for unified Open Interest management
 * @dev Represents the three OI storage systems in Gains Network v10
 */

/**
 * @dev Unified pair OI structure combining all storage systems
 */
export interface UnifiedPairOi {
  /**
   * @dev Maximum allowed OI in collateral (applies to combined OI)
   */
  maxCollateral: number;

  /**
   * @dev Pre-v10 trades OI stored in collateral amounts
   * @dev Static values from when positions were opened
   */
  beforeV10Collateral: {
    long: number;
    short: number;
  };

  /**
   * @dev Post-v10 trades OI stored in collateral amounts
   * @dev Initial collateral values when positions were opened
   * @dev Used for administrative operations and static calculations
   */
  collateral: {
    long: number;
    short: number;
  };

  /**
   * @dev Post-v10 trades OI stored in token amounts
   * @dev Used for dynamic calculations (multiply by current price)
   * @dev Powers skew impact and funding fees
   */
  token: {
    long: number;
    short: number;
  };
}

export type GenericPairOiContext = {
  pairOis: UnifiedPairOi[];
};

/**
 * @dev Group OI remains unchanged - only used by borrowing v1
 * @dev Re-export existing type for consistency
 */
export { OpenInterest as GroupOi } from "../../trade/types";

/**
 * @dev Helper type for computed OI values
 */
export interface ComputedOi {
  /**
   * @dev Total OI using static values: beforeV10Collateral + collateral
   * @dev Used for administrative operations
   */
  totalStaticCollateral: {
    long: number;
    short: number;
  };

  /**
   * @dev Total OI using dynamic values: beforeV10Collateral + (token * price)
   * @dev Used for real-time calculations like fees
   */
  totalDynamicCollateral: {
    long: number;
    short: number;
  };

  /**
   * @dev v10-only OI using static collateral values
   * @dev Used for funding fee markets display
   */
  v10StaticCollateral: {
    long: number;
    short: number;
  };

  /**
   * @dev v10-only OI using dynamic values: token * price
   * @dev Used for funding fee markets real-time display
   */
  v10DynamicCollateral: {
    long: number;
    short: number;
  };

  /**
   * @dev Net skew in tokens (v10+ only)
   * @dev Positive = more longs, negative = more shorts
   */
  skewToken: number;
}
