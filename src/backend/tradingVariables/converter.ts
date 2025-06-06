import {
  ContestLeaderboardBackendEntry,
  ContestLeaderboardEntry,
} from "@gainsnetwork/contests";
import {
  BorrowingFee,
  CollateralConfig,
  convertBorrowingFeeParamsArrayV2,
  convertFundingFeeParamsArray,
  convertPairBorrowingFeeDataArrayV2,
  convertPairFundingFeeDataArray,
  convertPairGlobalParamsArray,
  convertPairOiArray,
  Fee,
  FeeTiers,
  getPairDescription,
  GlobalTradeFeeParams,
  LiquidationParams,
  OiWindows,
  OiWindowsSettings,
  OpenInterest,
  Pair,
  PairDepth,
  PairOi,
  Trade,
  TradeContainer,
  TradeInfo,
  TradeInitialAccFees,
  TraderFeeTiers,
  TradingGroup,
  PairFactor,
} from "../../";
import {
  BorrowingFeePerBlockCapBackend,
  CollateralBackend,
  FeeBackend,
  FeeTiersBackend,
  GlobalTradeFeeParamsBackend,
  LiquidationParamsBackend,
  OiWindowsBackend,
  OiWindowsSettingsBackend,
  OpenInterestBackend,
  PairBackend,
  PairBorrowingFeesBackendGroup,
  PairBorrowingFeesBackendPair,
  PairBorrowingFeesBackendPairGroup,
  PairDepthBackend,
  PairFactorBackend,
  PairOiBackend,
  PairParamsBorrowingFeesBackend,
  TradeBackend,
  TradeContainerBackend,
  TradeInfoBackend,
  TradeInitialAccFeesBackend,
  TraderFeeTiersBackend,
  TradingGroupBackend,
} from "./backend.types";
import { TradingVariablesCollateral } from "./types";
import { IFundingFees } from "src/contracts/types/generated/GNSMultiCollatDiamond";

export const convertFees = (fees: FeeBackend[]): Fee[] =>
  fees?.map(fee => convertFee(fee));

const convertCollateral = (
  collateral: CollateralBackend
): TradingVariablesCollateral => ({
  pairBorrowingFees:
    collateral.borrowingFees?.v1 !== undefined
      ? convertPairBorrowingFees(collateral.borrowingFees.v1)
      : [],
  groupBorrowingFees:
    collateral.borrowingFees?.v1 !== undefined
      ? convertGroupBorrowingFees(collateral.borrowingFees.v1)
      : [],
  collateral: collateral.collateral,
  collateralConfig: convertCollateralConfig(collateral),
  collateralIndex: collateral.collateralIndex,
  gToken: collateral.gToken,
  isActive: true,
  prices: collateral.prices,
  symbol: collateral.symbol,
  pairBorrowingFeesV2: {
    params: convertBorrowingFeeParamsArrayV2(
      collateral.borrowingFees?.v2
        ?.pairParams as any as IFundingFees.BorrowingFeeParamsStructOutput[]
    ),
    data: convertPairBorrowingFeeDataArrayV2(
      collateral.borrowingFees?.v2
        ?.pairData as any as IFundingFees.PairBorrowingFeeDataStructOutput[]
    ),
  },
  pairFundingFees: {
    globalParams: convertPairGlobalParamsArray(
      collateral.fundingFees
        ?.pairGlobalParams as any as IFundingFees.PairGlobalParamsStructOutput[]
    ),
    params: convertFundingFeeParamsArray(
      collateral.fundingFees
        ?.pairParams as any as IFundingFees.FundingFeeParamsStructOutput[]
    ),
    data: convertPairFundingFeeDataArray(
      collateral.fundingFees
        ?.pairData as any as IFundingFees.PairFundingFeeDataStructOutput[]
    ),
  },
  pairOis: convertPairOiArray(
    collateral.pairOis as any,
    collateral.collateralConfig.decimals
  ),
});

export const convertCollaterals = (
  collaterals: CollateralBackend[]
): TradingVariablesCollateral[] =>
  collaterals?.map(collateral => convertCollateral(collateral));

const convertFee = (fee: FeeBackend): Fee => ({
  totalPositionSizeFeeP: parseFloat(fee.totalPositionSizeFeeP) / 1e12,
  totalLiqCollateralFeeP: parseFloat(fee.totalLiqCollateralFeeP) / 1e12,
  oraclePositionSizeFeeP: parseFloat(fee.oraclePositionSizeFeeP) / 1e12,
  minPositionSizeUsd: parseFloat(fee.minPositionSizeUsd) / 1e3,
});

export const convertOpenInterests = (
  interests: OpenInterestBackend[]
): OpenInterest[] => interests?.map(interest => convertOpenInterest(interest));

const convertOpenInterest = (interest: OpenInterestBackend): OpenInterest => ({
  long: parseFloat(interest.beforeV10.long) / 1e10,
  short: parseFloat(interest.beforeV10.short) / 1e10,
  max: parseFloat(interest.beforeV10.max) / 1e10,
});

export const convertPairDepths = (
  pairDepths: PairDepthBackend[]
): PairDepth[] => pairDepths?.map(pairDepth => convertPairDepth(pairDepth));

const convertPairDepth = (pairDepth: PairDepthBackend): PairDepth => ({
  onePercentDepthAboveUsd: parseInt(pairDepth.onePercentDepthAboveUsd),
  onePercentDepthBelowUsd: parseInt(pairDepth.onePercentDepthBelowUsd),
});

export const convertPairBorrowingFees = (
  pairParams: PairParamsBorrowingFeesBackend
): BorrowingFee.Pair[] =>
  pairParams?.pairs.map(pairParam => convertPairBorrowingFee(pairParam));

const convertPairGroupBorrowingFee = (
  pairParam: PairBorrowingFeesBackendPairGroup
): BorrowingFee.PairGroup => ({
  groupIndex: parseInt(pairParam.groupIndex),
  initialAccFeeLong: parseFloat(pairParam.initialAccFeeLong) / 1e10,
  initialAccFeeShort: parseFloat(pairParam.initialAccFeeShort) / 1e10,
  pairAccFeeLong: parseFloat(pairParam.pairAccFeeLong) / 1e10,
  pairAccFeeShort: parseFloat(pairParam.pairAccFeeShort) / 1e10,
  prevGroupAccFeeLong: parseFloat(pairParam.prevGroupAccFeeLong) / 1e10,
  prevGroupAccFeeShort: parseFloat(pairParam.prevGroupAccFeeShort) / 1e10,
  block: parseInt(pairParam.block),
});

const convertPairBorrowingFee = (
  pairParams: PairBorrowingFeesBackendPair
): BorrowingFee.Pair => ({
  groups: pairParams.groups.map(pairParam =>
    convertPairGroupBorrowingFee(pairParam)
  ),
  feePerBlock: parseFloat(pairParams.feePerBlock) / 1e10,
  accFeeLong: parseFloat(pairParams.accFeeLong) / 1e10,
  accFeeShort: parseFloat(pairParams.accFeeShort) / 1e10,
  accLastUpdatedBlock: parseInt(pairParams.accLastUpdatedBlock),
  oi: {
    max: parseFloat(pairParams.oi.beforeV10.max) / 1e10 || 0,
    long: parseFloat(pairParams.oi.beforeV10.long) / 1e10 || 0,
    short: parseFloat(pairParams.oi.beforeV10.short) / 1e10 || 0,
  },
  feeExponent: parseInt(pairParams.feeExponent) || 0,
  feePerBlockCap: convertFeePerBlockCap(pairParams?.feePerBlockCap),
});

export const convertGroupBorrowingFees = (
  pairParams: PairParamsBorrowingFeesBackend
): BorrowingFee.Group[] =>
  pairParams?.groups.map(pairParam => convertGroupBorrowingFee(pairParam));

const convertGroupBorrowingFee = (
  pairParams: PairBorrowingFeesBackendGroup
): BorrowingFee.Group => ({
  oi: {
    long: parseFloat(pairParams.oi.long) / 1e10,
    short: parseFloat(pairParams.oi.short) / 1e10,
    max: parseFloat(pairParams.oi.max) / 1e10 || 0,
  },
  feePerBlock: parseFloat(pairParams.feePerBlock) / 1e10,
  accFeeLong: parseFloat(pairParams.accFeeLong) / 1e10,
  accFeeShort: parseFloat(pairParams.accFeeShort) / 1e10,
  accLastUpdatedBlock: parseInt(pairParams.accLastUpdatedBlock),
  feeExponent: parseInt(pairParams.feeExponent) || 0,
});

export const convertTradingGroups = (
  groups: TradingGroupBackend[]
): TradingGroup[] => groups?.map(group => convertTradingGroup(group));

const convertTradingGroup = (group: TradingGroupBackend): TradingGroup => ({
  maxLeverage: parseFloat(group.maxLeverage) / 1e3,
  minLeverage: parseFloat(group.minLeverage) / 1e3,
  name: group.name,
});

export const convertTradingPairs = (pairs: PairBackend[]): Pair[] =>
  pairs
    ?.filter(pair => pair.from !== "")
    .map((pair, index) => convertTradingPair(pair, index));

const convertTradingPair = (pair: PairBackend, index: number): Pair => ({
  name: convertPairName(pair),
  description: getPairDescription(index),
  from: pair.from,
  to: pair.to,
  pairIndex: index,
  feeIndex: parseInt(pair.feeIndex),
  groupIndex: parseInt(pair.groupIndex),
  spreadP: parseFloat(pair.spreadP) / 1e10 / 100,
});

export const convertTradesAndLimitOrders = (
  allItems: TradeContainerBackend[],
  collaterals: TradingVariablesCollateral[]
): TradeContainer[] =>
  allItems?.map(item => {
    return convertTradeContainer(item, collaterals);
  });

export const convertTradeContainer = (
  tradeContainer: TradeContainerBackend,
  collaterals: TradingVariablesCollateral[]
): TradeContainer => ({
  trade: convertTrade(tradeContainer.trade, collaterals),
  tradeInfo: convertTradeInfo(tradeContainer.tradeInfo),
  initialAccFees:
    tradeContainer.initialAccFees === undefined
      ? {
          accPairFee: 0,
          accGroupFee: 0,
          block: 0,
        }
      : convertTradeInitialAccFees(tradeContainer.initialAccFees),
  liquidationParams:
    tradeContainer.liquidationParams === undefined
      ? {
          maxLiqSpreadP: 0,
          startLiqThresholdP: 0,
          endLiqThresholdP: 0,
          startLeverage: 0,
          endLeverage: 0,
        }
      : convertLiquidationParams(tradeContainer.liquidationParams),
});

export const convertLiquidationParams = (
  liquidationParams: LiquidationParamsBackend
): LiquidationParams => {
  const ONCHAIN_LIQ_THRESHOLD = 0.9;
  return {
    maxLiqSpreadP: parseFloat(liquidationParams.maxLiqSpreadP) / 1e12,
    startLiqThresholdP:
      parseFloat(liquidationParams.startLiqThresholdP) / 1e12 ||
      ONCHAIN_LIQ_THRESHOLD,
    endLiqThresholdP:
      parseFloat(liquidationParams.endLiqThresholdP) / 1e12 ||
      ONCHAIN_LIQ_THRESHOLD,
    startLeverage: parseFloat(liquidationParams.startLeverage) / 1e3,
    endLeverage: parseFloat(liquidationParams.endLeverage) / 1e3,
  };
};

export const convertPairFactor = (
  pairFactor: PairFactorBackend
): PairFactor => ({
  cumulativeFactor: parseFloat(pairFactor.cumulativeFactor) / 1e10,
  protectionCloseFactor: parseFloat(pairFactor.protectionCloseFactor) / 1e10,
  protectionCloseFactorBlocks: parseInt(pairFactor.protectionCloseFactorBlocks),
  exemptOnOpen: pairFactor.exemptOnOpen,
  exemptAfterProtectionCloseFactor: pairFactor.exemptAfterProtectionCloseFactor,
});

export const convertTrade = (
  trade: TradeBackend,
  collaterals: TradingVariablesCollateral[]
): Trade => {
  const { long, user } = trade;
  const collateralIndex = parseInt(trade.collateralIndex);
  return {
    user,
    index: parseInt(trade.index),
    pairIndex: parseInt(trade.pairIndex),
    leverage: parseInt(trade.leverage) / 1e3,
    long,
    isOpen: trade.isOpen,
    collateralIndex,
    tradeType: parseInt(trade.tradeType),
    collateralAmount:
      parseFloat(trade.collateralAmount) /
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-non-null-asserted-optional-chain
      10 ** collaterals[collateralIndex - 1]?.collateralConfig?.decimals!,
    openPrice: parseFloat(trade.openPrice) / 1e10,
    sl: parseFloat(trade.sl) / 1e10,
    tp: parseFloat(trade.tp) / 1e10,
  };
};

export const convertTradeInfo = (tradeInfo: TradeInfoBackend): TradeInfo => ({
  createdBlock: parseInt(tradeInfo.createdBlock),
  tpLastUpdatedBlock: parseInt(tradeInfo.tpLastUpdatedBlock),
  slLastUpdatedBlock: parseInt(tradeInfo.slLastUpdatedBlock),
  maxSlippageP: parseFloat(tradeInfo.maxSlippageP) / 1e3 || 1,
  lastOiUpdateTs: tradeInfo.lastOiUpdateTs,
  collateralPriceUsd:
    tradeInfo.collateralPriceUsd && tradeInfo.collateralPriceUsd !== "0"
      ? parseFloat(tradeInfo.collateralPriceUsd) / 1e8
      : 1,
  contractsVersion: parseInt(tradeInfo.contractsVersion),
  lastPosIncreaseBlock: parseInt(tradeInfo.lastPosIncreaseBlock),
});

export const convertTradeInitialAccFees = (
  initialAccFees: TradeInitialAccFeesBackend
): TradeInitialAccFees => ({
  accPairFee: parseFloat(initialAccFees.accPairFee || "0") / 1e10,
  accGroupFee: parseFloat(initialAccFees.accGroupFee || "0") / 1e10,
  block: parseInt(initialAccFees.block || "0"),
});

export const generateStockPairToActiveStockSplit = (
  pairs?: PairBackend[]
): Map<string, string> => {
  const result = new Map();
  if (!pairs) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return result;
  }

  const basePairFroms = new Set<string>();
  const splitPairFroms = new Set<string>();
  pairs.forEach(p => {
    const from = p.from;
    if (from.includes("_")) {
      splitPairFroms.add(from);
    } else {
      basePairFroms.add(from);
    }
  });

  splitPairFroms.forEach(splitFrom => {
    const [potentialSplitPairFromBase, potentialSplitPairFromSplitId] =
      splitFrom.split("_");
    const currentHighestSplitPairIdForBasePair = result.get(
      potentialSplitPairFromBase
    );
    if (
      (currentHighestSplitPairIdForBasePair &&
        +potentialSplitPairFromSplitId >
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
          +currentHighestSplitPairIdForBasePair.split("_")[1]) ||
      (!currentHighestSplitPairIdForBasePair &&
        basePairFroms.has(potentialSplitPairFromBase))
    ) {
      result.set(potentialSplitPairFromBase, splitFrom);
    }
  });

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return result;
};

export const convertContestLeaderboardEntry = (
  entry: ContestLeaderboardBackendEntry
): ContestLeaderboardEntry => {
  const [
    trader,
    numWins,
    numLosses,
    avgWin,
    avgLoss,
    daiProfit,
    pctProfit,
    daiVolume,
  ] = entry;
  return {
    trader,
    numWins,
    numLosses,
    avgWin,
    avgLoss,
    daiProfit,
    pctProfit,
    daiVolume,
  };
};

// OiWindow values are normalized to USD 1e18
export const convertPairOi = (collateral: PairOiBackend): PairOi => ({
  oiLongUsd: parseFloat(collateral.oiLongUsd) / 1e18,
  oiShortUsd: parseFloat(collateral.oiShortUsd) / 1e18,
});

export const convertOiWindows = (
  oiWindows: OiWindowsBackend[]
): OiWindows[] => {
  return oiWindows?.map(pairWindows => {
    const converted: OiWindows = {};
    for (const [key, oiWindow] of Object.entries(pairWindows)) {
      converted[key] = convertPairOi(oiWindow);
    }
    return converted;
  });
};

export const convertOiWindowsSettings = (
  oiWindowsSettings: OiWindowsSettingsBackend
): OiWindowsSettings => ({
  startTs: oiWindowsSettings.startTs,
  windowsDuration: oiWindowsSettings.windowsDuration,
  windowsCount: oiWindowsSettings.windowsCount,
});

export const convertCollateralConfig = (
  collateral: CollateralBackend
): CollateralConfig => ({
  collateral: collateral.collateral,
  isActive: collateral.isActive,
  precision: parseInt(collateral.collateralConfig.precision),
  precisionDelta: parseInt(collateral.collateralConfig.precisionDelta),
  decimals: collateral.collateralConfig.decimals,
});

export const convertFeeTiers = (
  feeTiersBackend: FeeTiersBackend
): FeeTiers => ({
  tiers: feeTiersBackend?.tiers.map(tier => ({
    feeMultiplier: Number(tier.feeMultiplier) / 1e3,
    pointsThreshold: parseFloat(tier.pointsThreshold),
  })),
  multipliers:
    feeTiersBackend?.multipliers?.map(mult => parseFloat(mult) / 1e3) || [],
  currentDay: feeTiersBackend?.currentDay || 0,
});

export const convertTraderFeeTiers = (
  traderFeeTiers: TraderFeeTiersBackend
): TraderFeeTiers => ({
  traderEnrollment: {
    status: traderFeeTiers.traderEnrollment.status,
  },
  traderInfo: {
    lastDayUpdated: traderFeeTiers.traderInfo.lastDayUpdated,
    trailingPoints: parseFloat(traderFeeTiers.traderInfo.trailingPoints) / 1e18,
  },
  inboundPoints: parseFloat(traderFeeTiers.inboundPoints) / 1e18,
  outboundPoints: parseFloat(traderFeeTiers.outboundPoints) / 1e18,
  lastDayUpdatedPoints: parseFloat(traderFeeTiers.lastDayUpdatedPoints) / 1e18,
  expiredPoints: traderFeeTiers.expiredPoints.map(
    point => parseFloat(point) / 1e18
  ),
  unclaimedPoints: parseFloat(traderFeeTiers.unclaimedPoints) / 1e18,
});

export const convertGlobalTradeFeeParams = (
  fee: GlobalTradeFeeParamsBackend
): GlobalTradeFeeParams => ({
  referralFeeP: parseFloat(fee.referralFeeP) / 1e5,
  govFeeP: parseFloat(fee.govFeeP) / 1e5,
  triggerOrderFeeP: parseFloat(fee.triggerOrderFeeP) / 1e5,
  gnsOtcFeeP: parseFloat(fee.gnsOtcFeeP) / 1e5,
  gTokenFeeP: parseFloat(fee.gTokenFeeP) / 1e5,
});

export const convertMaxLeverages = (maxLeverages: string[]): number[] =>
  maxLeverages?.map(maxLeverage => parseFloat(maxLeverage) / 1e3);

export const convertFeePerBlockCap = (
  feeCap: BorrowingFeePerBlockCapBackend | undefined
): BorrowingFee.BorrowingFeePerBlockCap => ({
  minP: feeCap?.minP ? parseFloat(feeCap.minP.toString()) / 1e3 / 100 : 0,
  maxP: feeCap?.maxP ? parseFloat(feeCap.maxP.toString()) / 1e3 / 100 : 1,
});

export const convertPairName = (pair?: PairBackend): string => {
  if (!pair) return "";
  return pair.from.split("_")[0] + "/" + pair.to;
};
