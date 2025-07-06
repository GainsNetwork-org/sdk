# v10 migration

## v10 Changes - Overview

- New funding fees (skew-based, only on v10 positions)
- New borrowing fees v2 (alongside existing v1)
- Modified borrowing fees v1 (uses dynamic OI)
- New P&L withdrawal feature (withdraw profits without closing)
- New counter trade type (fee discounts for improving skew)
- New skew price impact
- New market max skew limits
- Modified partial update requirements (use effective leverage)
- Modified liquidation, pnl, fees calculations
- Fees no longer impact position size (exact position sizes)
- Pre and post v10 OI stored separately
- Pre-v10 trades cannot partial add
- New accounting: TradeFeesData and UiRealizedPnlData
- New Trade fields: positionSizeToken and isCounterTrade

## Developer Notes - Overview

- SDK has been updated to support v10 more effectively than previous versions
  - Backend transforms and converters are available (fetching is still separate)
    - Transform trading variables: `transformGlobalTradingVariables`
    - Transform global trades: `transformGlobalTrades`
    - All functions expect backend types
  - Additional feature support
    - Holding fees
    - Action fees
    - Price impact
    - PnL
    - Liquidations
    - Counter trade validation
    - Effective leverage
    - Market holding rates
    - Market leverage requirements
    - Market open interest
    - Market price
  - New context builders
    - More declarative development pattern
    - SDK functions mirror contract functions. But they don't fetch data, instead rely on all data provided
    - Provide large trading variables object and context builder will prepare struct for specific functions with all expected data

## Integration Guide

### 1. New Funding Fees

Funding fees are skew-based fees that balance long/short exposure.

**Trade-Specific Funding Fees:**

```typescript
import { buildFundingContext } from "@gainsnetwork/sdk/trade/fees/fundingFees/builder";
import {
  getTradeFundingFeesCollateral,
  getAvgFundingRatePerSecondP,
} from "@gainsnetwork/sdk/trade/fees/fundingFees";

// Build funding context
const fundingContext = buildFundingContext(
  tradingVariables,
  collateralIndex,
  pairIndex,
  currentTimestamp
);

// Calculate funding fees for a trade
const fundingFees = getTradeFundingFeesCollateral(
  trade,
  currentTimestamp,
  fundingContext
);

// Get current funding rate
const { avgFundingRatePerSecondP, currentFundingRatePerSecondP } =
  getAvgFundingRatePerSecondP(fundingContext, currentTimestamp);
```

**Display helpers:**

```typescript
import {
  convertRatePerSecondToAPR,
  formatHoldingFeeRate,
} from "@gainsnetwork/sdk/markets/holdingFees";
import { fundingRateToAPR } from "@gainsnetwork/sdk/trade/fees/fundingFees/converter";

// Convert to annual percentage rate
const apr = convertRatePerSecondToAPR(ratePerSecond);
const fundingAPR = fundingRateToAPR(fundingRatePerSecond);

// Format for display (e.g., "0.25%")
const formatted = formatHoldingFeeRate(rate);
```

### 2. New Borrowing Fees v2

Borrowing fees v2 work alongside funding fees with a simplified rate-based model.

**Context Builder & Calculation:**

```typescript
import { buildBorrowingV2Context } from "@gainsnetworks/sdk/trade/fees/borrowingV2/builder";
import { getTradeBorrowingFeesCollateral } from "@gainsnetworks/sdk/trade/fees/borrowingV2";

// Build borrowing v2 context
const borrowingV2Context = buildBorrowingV2Context(
  tradingVariables,
  collateralIndex,
  pairIndex,
  currentTimestamp
);

// Calculate borrowing fees for a trade
const borrowingFees = getTradeBorrowingFeesCollateral(
  trade,
  currentTimestamp,
  oraclePrice,
  borrowingV2Context
);
```

**Display helpers:**

```typescript
import { borrowingRateToAPR } from "@gainsnetworks/sdk/trade/fees/borrowingV2/converter";

// Convert borrowing rate to APR for display
const borrowingAPR = borrowingRateToAPR(borrowingRatePerSecond);
```

### 3. Modified Borrowing Fees v1

Borrowing fees v1 now use dynamic OI (position size adjusted by current price vs entry price).

**Context Builder & Calculation:**

```typescript
import { buildBorrowingV1Context } from "@gainsnetworks/sdk/trade/fees/borrowing/builder";
import { getBorrowingFee } from "@gainsnetworks/sdk/trade/fees/borrowing";

// Build borrowing v1 context
const borrowingV1Context = buildBorrowingV1Context(
  tradingVariables,
  collateralIndex,
  currentBlock
);

// Calculate borrowing fee for a trade
const borrowingFee = getBorrowingFee(
  positionSizeCollateral,
  pairIndex,
  isLong,
  initialAccFees,
  borrowingV1Context
);
```

**Utility functions:**

```typescript
import { borrowingFeeUtils } from "@gainsnetworks/sdk/trade/fees/borrowing";

// Get pending accumulated fees for a pair
const pendingFees = borrowingFeeUtils.getPairPendingAccFees(
  pairs,
  pairGroups,
  groups,
  initialAccFees,
  pairIndex,
  currentBlock,
  feePerBlockCaps
);

// Check if within max group OI
const withinLimit = borrowingFeeUtils.withinMaxGroupOi(
  pairs,
  pairGroups,
  groups,
  positionSizeCollateral,
  pairIndex,
  isLong
);
```

### 4. P&L Withdrawal Feature

Users can withdraw profits without closing their position. This maintains leverage while extracting gains.

**Contract Interaction:**

```typescript
// Direct contract call (no SDK wrapper currently)
const tx = await gnsMultiCollatDiamond.withdrawPositivePnl(
  tradeIndex,
  amountCollateral // in collateral precision (e.g., 6 decimals for USDC)
);
```

**Important behavior:** If `amountCollateral` exceeds available positive PnL, the contract will automatically withdraw only the maximum available amount (no revert).

**To withdraw all available PnL:**

```typescript
const MAX_UINT120 = BigNumber.from(2).pow(120).sub(1);
const tx = await gnsMultiCollatDiamond.withdrawPositivePnl(
  tradeIndex,
  MAX_UINT120 // Will be capped to available PnL
);
```

**Integration requirements:**

- Calculate withdrawable P&L: `tradeValue - initialCollateral` (when positive)
- Show withdrawable amount in UI when position is in profit
- Listen for `TradePositivePnlWithdrawn` event to update UI
- Update position display after withdrawal:
  - `collateralAmount` increases
  - `positionSizeToken` remains unchanged
  - Track `pnlWithdrawnCollateral` for total withdrawn

### 5. Counter Trade Type

Counter trades improve market balance and receive fee discounts.

**Creating a Counter Trade:**

```typescript
// When opening a trade, set the isCounterTrade flag
const tradeStruct = {
  // ... other trade parameters ...
  isCounterTrade: true, // Request counter trade discount
};

// Open trade with counter trade flag
const tx = await gnsMultiCollatDiamond.openTrade(
  tradeStruct,
  slippagePercent,
  referrer
);
```

**Note:** The contract will validate if the trade actually qualifies as a counter trade. If not, it will be opened as a regular trade.

**Pre-validation:**

```typescript
import { validateCounterTrade } from "@gainsnetworks/sdk/trade/counterTrade/validateCounterTrade";

// Check if trade qualifies as counter trade before submitting
const validation = validateCounterTrade(
  isLong,
  positionSizeCollateral,
  leverage,
  pairIndex,
  tradingVariables
);
```

**Detection (for existing trades):**

```typescript
// Check Trade struct field
const isCounterTrade = trade.isCounterTrade; // boolean field in v10 trades
```

### 6. Skew Price Impact

Price impact based on market skew (imbalance between long/short OI).

**NOTE:** The SDK offers wrapper utilities for open and close price impact which can be used to calculate all price impact data. More in SDK convenience functions.

**Context Builder & Calculation:**

```typescript
import { buildSkewPriceImpactContext } from "@gainsnetwork/sdk/trade/priceImpact/skew/builder";
import { getTradeSkewPriceImpact } from "@gainsnetwork/sdk/trade/priceImpact/skew";

// Build context
const skewContext = buildSkewPriceImpactContext(
  tradingVariables,
  collateralIndex,
  pairIndex
);

// Calculate skew price impact
const skewImpact = getTradeSkewPriceImpact(
  isLong,
  oraclePrice,
  positionSizeToken,
  skewContext
);
```

**Helper functions:**

```typescript
import {
  getNetSkewToken,
  getNetSkewCollateral,
} from "@gainsnetwork/sdk/trade/priceImpact/skew";

// Get current market skew
const skewToken = getNetSkewToken(pairOiData);
const skewCollateral = getNetSkewCollateral(pairOiData, oraclePrice);
```

### 7. Market Max Skew Limits

Markets have maximum allowed skew to prevent excessive imbalance.

**Check skew using computeOiValues:**

```typescript
import { computeOiValues } from "@gainsnetworks/sdk/markets/oi/converter";

// Compute current OI values including skew
const { skewToken } = computeOiValues(
  pairOi,
  oraclePrice / collateralPriceUsd // Convert to token price in collateral
);

// Get max skew from trading variables
const maxSkewCollateral =
  tradingVariables.pairs[pairIndex]?.params?.maxSkewCollateral;

// Convert skewToken to collateral for comparison
const skewCollateral = Math.abs(skewToken) * (oraclePrice / collateralPriceUsd);
const skewExceeded = skewCollateral > maxSkewCollateral;
```

**Note:** For counter trade validation and position sizing, use `validateCounterTrade` (see section 5).

### 8. Effective Leverage in Partial Updates

Partial position updates now validate against effective leverage (accounts for unrealized P&L).

**Calculation:**

```typescript
import { getEffectiveLeverage } from "@gainsnetworks/sdk/trade/effectiveLeverage";

// Calculate effective leverage
const effectiveLeverage = getEffectiveLeverage(
  trade.leverage,
  trade.collateralAmount,
  pnlCollateral
);
```

**Validation Requirements:**

**For Position Increases (Partial Add):**

- Effective leverage must not exceed `pairMaxLeverage`
- Counter trades must not exceed `pairCounterTradeMaxLeverage`
- Adjusted initial leverage must be between 0.1x and max uint24 (~16,777x)
- Pre-v10 trades cannot partial add

**For Position Decreases (Partial Close):**

- No effective leverage maximum check
- Only validates adjusted initial leverage (≥ 0.1x)

**For Leverage Increases:**

- Same as position increases - effective leverage validated

**For Leverage Decreases (Add Collateral):**

- Same as position decreases - no effective leverage check

```typescript
// Example validation
const maxLeverage = isCounterTrade
  ? tradingVariables.pairs[pairIndex].maxLeverageCounterTrade
  : tradingVariables.pairs[pairIndex].maxLeverage;

const isValid = effectiveLeverage <= maxLeverage;
const MIN_LEVERAGE = 0.1; // 0.1x minimum
```

### 9. Modified Liquidation Calculations

Liquidation now accounts for pending fees and realized P&L.

**Context Builder & Calculation:**

```typescript
import { buildLiquidationPriceContext } from "@gainsnetwork/sdk/trade/liquidation/builder";
import { getLiquidationPrice } from "@gainsnetwork/sdk/trade/liquidation";

// Build comprehensive context
const liquidationContext = buildLiquidationPriceContext(
  tradingVariables,
  tradeContainer,
  {
    currentBlock,
    currentTimestamp,
    currentPairPrice,
    spreadP,
    traderFeeMultiplier,
    userPriceImpact,
  }
);

// Calculate liquidation price
const liqPrice = getLiquidationPrice(trade, liquidationContext);
```

**Additional functions:**

```typescript
import { getLiquidationPriceAfterPositionUpdate } from "@gainsnetwork/sdk/trade/liquidation";

// Calculate after position update
const newLiqPrice = getLiquidationPriceAfterPositionUpdate(
  existingTrade,
  existingLiquidationContext,
  newCollateralAmount,
  newLeverage
);
```

### 10. Modified PnL Calculations

Comprehensive PnL includes all v10 components: funding fees, borrowing fees, and realized P&L.

**Context Builder & Calculation:**

```typescript
import { buildComprehensivePnlContext } from "@gainsnetwork/sdk/trade/pnl/builder";
import { getComprehensivePnl } from "@gainsnetwork/sdk/trade/pnl";

// Build context
const pnlContext = buildComprehensivePnlContext(
  tradingVariables,
  tradeContainer,
  {
    currentBlock,
    currentTimestamp,
    traderFeeMultiplier,
  }
);

// Calculate comprehensive PnL
const pnl = getComprehensivePnl(
  trade,
  marketPrice,
  executionPrice, // price after spreads/impacts
  tradeInfo,
  pnlContext
);
```

**Helper functions:**

```typescript
import { getPnlPercent, getTradeValue } from "@gainsnetwork/sdk/trade/pnl";

// Calculate PnL percentage
const pnlPercent = getPnlPercent(openPrice, currentPrice, isLong, leverage);

// Get trade value (collateral + PnL)
const tradeValue = getTradeValue(collateralAmount, pnlCollateral);
```

### 11. New Trade Fields

v10 trades have additional fields that must be parsed and stored.

**New fields in Trade struct:**

```typescript
interface Trade {
  // ... existing fields ...
  positionSizeToken: bigint; // Position size in token units (1e18 precision)
  isCounterTrade: boolean; // Whether trade qualified for counter trade discount
}
```

### 12. V10 OI Tracking

OI is tracked separately for pre-v10 and post-v10 trades.

**OI Functions:**

```typescript
import {
  getPairTotalOisCollateral,
  getPairTotalOisDynamicCollateral,
  getPairV10OiTokenSkewCollateral,
  getPairV10OiDynamicSkewCollateral,
} from "@gainsnetworks/sdk/markets/oi";

// Get total OI (pre-v10 only)
const staticOI = getPairTotalOisCollateral(pairOi);

// Get dynamic OI (pre-v10 + v10 adjusted by price)
const dynamicOI = getPairTotalOisDynamicCollateral(pairOi, oraclePrice);

// Get v10 skew in collateral
const skewCollateral = getPairV10OiTokenSkewCollateral(pairOi, oraclePrice);

// Get v10 dynamic skew
const dynamicSkew = getPairV10OiDynamicSkewCollateral(pairOi, oraclePrice);
```

**Comprehensive OI Values:**

```typescript
import { computeOiValues } from "@gainsnetwork/sdk/markets/oi/converter";

// Get all computed OI values at once
const oiValues = computeOiValues(
  pairOi,
  oraclePrice / collateralPriceUsd // Convert to token price in collateral
);
```

**Important notes:**

- Funding fees only apply to v10 OI
- Skew calculations use v10 OI only
- Max OI checks use combined OI (pre-v10 + v10)
- Counter trade validation uses v10 skew

## Market Price Concept

Market price is a v10 feature that applies to markets with funding fees and skew price impact. It represents the oracle price adjusted for current market skew.

**Calculate Market Price:**

```typescript
import { getCurrentMarketPrice } from "@gainsnetworks/sdk/markets/price/marketPrice";
import { buildMarketPriceContext } from "@gainsnetworks/sdk/markets/price/builder";

// Build context for market price calculation
const marketPriceContext = buildMarketPriceContext(tradingVariables, pairIndex);

// Calculate market price from oracle price
const { marketPrice, skewImpactP } = getCurrentMarketPrice(
  pairIndex,
  oraclePrice,
  marketPriceContext
);
```

## SDK Wrapper Functions

The SDK provides high-level wrapper functions that combine multiple calculations for common operations.

### Price Impact

**Opening a Trade:**

```typescript
import { getTradeOpeningPriceImpact } from "@gainsnetwork/sdk/trade/priceImpact/open";
import { buildTradeOpeningPriceImpactContext } from "@gainsnetwork/sdk/trade/priceImpact/open/builder";

// Build context with all required data
const openContext = buildTradeOpeningPriceImpactContext(
  tradingVariables,
  collateralIndex,
  pairIndex,
  currentBlock
);

// Calculate total price impact and execution price
const openImpact = getTradeOpeningPriceImpact(
  oraclePrice, // Always pass oracle price
  isLong,
  positionSizeCollateral,
  leverage,
  openContext
);
```

**Understanding Price Impact Results:**

```typescript
// The function returns multiple price impact values:
const {
  priceAfterImpact, // Final execution price
  totalPriceImpactP, // Total impact from oracle price
  totalPriceImpactPFromMarketPrice, // Total impact from market price
  baseSkewPriceImpactP, // Market skew before trade
  tradeSkewPriceImpactP, // Additional skew from this trade
  totalSkewPriceImpactP, // Total skew impact (base + trade)
} = openImpact;

// For UI display:
// If showing market price: use totalPriceImpactPFromMarketPrice
// If showing oracle price: use totalPriceImpactP
```

**Closing a Trade:**

```typescript
import { getTradeClosingPriceImpact } from "@gainsnetwork/sdk/trade/priceImpact/close";
import { buildTradeClosingPriceImpactContext } from "@gainsnetwork/sdk/trade/priceImpact/close/builder";

// Build context
const closeContext = buildTradeClosingPriceImpactContext(
  tradingVariables,
  tradeContainer,
  currentBlock
);

// Calculate price impact for closing
const closeImpact = getTradeClosingPriceImpact(
  trade,
  oraclePrice, // Always pass oracle price
  closeContext
);

// Similar to opening, returns multiple impact values
const {
  priceAfterImpact,
  tradeValueCollateral,
  totalPriceImpactP, // From oracle price
  totalPriceImpactPFromMarketPrice, // From market price
  // ... other impact components
} = closeImpact;
```

### Action Fees (Trading Fees)

**Calculate Total Trading Fees:**

```typescript
import { getTotalTradeFeesCollateral } from "@gainsnetwork/sdk/trade/fees/trading";
import { buildTradingFeesContext } from "@gainsnetwork/sdk/trade/fees/trading/builder";

// Build context
const feesContext = buildTradingFeesContext(
  tradingVariables,
  collateralIndex,
  pairIndex
);

// Calculate total fees
const totalFees = getTotalTradeFeesCollateral(
  positionSizeCollateral,
  isCounterTrade,
  tradeTier,
  feesContext
);
```

**Get Detailed Fee Breakdown:**

```typescript
import { getTradeFeesCollateral } from "@gainsnetwork/sdk/trade/fees/trading";

// Get breakdown of all fee components
const feeBreakdown = getTradeFeesCollateral(
  positionSizeCollateral,
  pairOpenFeeP,
  tradeTierMultiplier,
  referralFeeP,
  pairTriggerOrderFeeP,
  pairOtcFeeP,
  collateralPrecision
);
// Returns: referralFees, govFees, triggerFees, gnsOtcFees, gTokenFees
```

**Calculate Pending Holding Fees:**

```typescript
import { getTradePendingHoldingFeesCollateral } from "@gainsnetwork/sdk/trade/fees/trading";

// Calculate all accumulated holding fees
const holdingFees = getTradePendingHoldingFeesCollateral(
  trade,
  currentBlock,
  currentTimestamp,
  oraclePrice,
  collateralPrecision,
  holdingFeesContext // combines funding + borrowing contexts
);
```

## Summary

The SDK provides all necessary functions to integrate v10 features. Key patterns:

1. **Use Context Builders**: Most complex calculations require a context object built from trading variables
2. **Transform Backend Data**: Use `transformGlobalTradingVariables` and `transformGlobalTrades` before passing to SDK functions
3. **Handle Pre-v10 Trades**: Check `trade.contractsVersion` to determine if a trade uses v10 features
4. **Display Market Rates**: Use functions in "Current Market Rates" section for market-wide statistics
